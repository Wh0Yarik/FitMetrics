import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import { colors, radii } from '../../../shared/ui';

let SkiaModules: typeof import('@shopify/react-native-skia') | null = null;
try {
  SkiaModules = require('@shopify/react-native-skia');
} catch {
  SkiaModules = null;
}

type MeasurementChartProps = {
  type: 'line' | 'bars';
  color: string;
  linePath?: string;
  points?: { x: number; y: number }[];
  secondaryLinePath?: string;
  secondaryPoints?: { x: number; y: number }[];
  secondaryColor?: string;
  series?: number[];
  emptyLabel?: string;
  size?: 'compact' | 'full';
  verticalScale?: number;
  interactive?: boolean;
  highlightIndex?: number | null;
  onPointHover?: (payload: { index: number; x: number; y: number } | null) => void;
  layoutOverride?: { width: number; height: number };
};

const withAlpha = (hexColor: string, alpha: number) => {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6 && normalized.length !== 8) return hexColor;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const MeasurementChart = ({
  type,
  color,
  linePath,
  points,
  secondaryLinePath,
  secondaryPoints,
  secondaryColor,
  emptyLabel,
  size = 'compact',
  verticalScale = 1,
  interactive = false,
  highlightIndex = null,
  onPointHover,
  layoutOverride,
}: MeasurementChartProps) => {
  const skiaSupported = Boolean(
    SkiaModules?.Skia?.Path?.MakeFromSVGString && SkiaModules?.Skia?.Recorder
  );
  const chartStyle = size === 'full' ? styles.chartFull : styles.chartCompact;
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [reveal, setReveal] = useState(0);
  const hoverIndexRef = useRef<number | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== layout.width || height !== layout.height) {
      setLayout({ width, height });
    }
  }, [layout.height, layout.width]);

  useEffect(() => {
    if (!linePath) return undefined;
    let frame = 0;
    const start = Date.now();
    const durationMs = 700;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / durationMs);
      setReveal(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    setReveal(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [linePath]);

  const effectiveLayout = layoutOverride ?? layout;

  const scaledPaths = useMemo(() => {
    if (!skiaSupported) return null;
    if (!linePath || effectiveLayout.width === 0 || effectiveLayout.height === 0) return null;
    const Skia = (SkiaModules as NonNullable<typeof SkiaModules>).Skia;
    const rawLine = Skia.Path.MakeFromSVGString(linePath);
    if (!rawLine) return null;
    const rawSecondary = secondaryLinePath ? Skia.Path.MakeFromSVGString(secondaryLinePath) : null;

    const paddingY = size === 'full' ? 10 : 8;
    const scaleX = effectiveLayout.width / 100;
    const scaleY = ((effectiveLayout.height - paddingY * 2) / 200) * verticalScale;
    const yOffset = paddingY * 2;
    const chartTop = yOffset;
    const chartBottom = yOffset + (effectiveLayout.height - paddingY * 2);

    const matrix = Skia.Matrix();
    matrix.scale(scaleX, scaleY);
    rawLine.transform(matrix);
    rawLine.offset(0, yOffset);
    if (rawSecondary) {
      rawSecondary.transform(matrix);
      rawSecondary.offset(0, yOffset);
    }

    const lineBounds = rawLine.computeTightBounds();
    const extraDrop = size === 'full' ? 30 : 20;
    const fillBaseY = Math.min(effectiveLayout.height, lineBounds.y + lineBounds.height + extraDrop);
    const minGradientHeight = size === 'full' ? 120 : 90;
    const gradientHeight = Math.min(
      effectiveLayout.height - lineBounds.y,
      Math.max(minGradientHeight, lineBounds.height + extraDrop * 2)
    );
    const fillFadeY = Math.min(effectiveLayout.height, lineBounds.y + gradientHeight);

    const scaledPoints = points?.map((point) => ({
      x: point.x * scaleX,
      y: point.y * scaleY + yOffset,
    })) ?? [];
    const scaledSecondaryPoints = secondaryPoints?.map((point) => ({
      x: point.x * scaleX,
      y: point.y * scaleY + yOffset,
    })) ?? [];

    const areaPath = rawLine.copy();
    const last = rawLine.getLastPt();
    const first = rawLine.getPoint(0);
    areaPath.lineTo(last.x, fillBaseY);
    areaPath.lineTo(first.x, fillBaseY);
    areaPath.close();

    return {
      line: rawLine,
      secondaryLine: rawSecondary,
      area: areaPath,
      scaledPoints,
      scaledSecondaryPoints,
      chartTop,
      chartBottom,
      fillBaseY,
      fillFadeY,
      lineBounds,
    };
  }, [
    linePath,
    secondaryLinePath,
    effectiveLayout.height,
    effectiveLayout.width,
    points,
    secondaryPoints,
    size,
    verticalScale,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: (event) => {
          if (!scaledPaths?.scaledPoints?.length) return;
          const { locationX } = event.nativeEvent;
          let nearest = 0;
          let minDist = Number.POSITIVE_INFINITY;
          scaledPaths.scaledPoints.forEach((point, index) => {
            const dist = Math.abs(point.x - locationX);
            if (dist < minDist) {
              minDist = dist;
              nearest = index;
            }
          });
          hoverIndexRef.current = nearest;
          if (onPointHover) {
            const point = scaledPaths.scaledPoints[nearest];
            onPointHover({ index: nearest, x: point.x, y: point.y });
          }
        },
        onPanResponderMove: (event) => {
          if (!scaledPaths?.scaledPoints?.length) return;
          const { locationX } = event.nativeEvent;
          let nearest = 0;
          let minDist = Number.POSITIVE_INFINITY;
          scaledPaths.scaledPoints.forEach((point, index) => {
            const dist = Math.abs(point.x - locationX);
            if (dist < minDist) {
              minDist = dist;
              nearest = index;
            }
          });
          if (hoverIndexRef.current === nearest) return;
          hoverIndexRef.current = nearest;
          if (onPointHover) {
            const point = scaledPaths.scaledPoints[nearest];
            onPointHover({ index: nearest, x: point.x, y: point.y });
          }
        },
        onPanResponderRelease: () => {
          hoverIndexRef.current = null;
          onPointHover?.(null);
        },
        onPanResponderTerminate: () => {
          hoverIndexRef.current = null;
          onPointHover?.(null);
        },
      }),
    [interactive, onPointHover, scaledPaths?.scaledPoints]
  );

  if (!skiaSupported || type !== 'line' || !linePath) {
    return (
      <View style={chartStyle}>
        {emptyLabel ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLineShort} />
          </View>
        ) : null}
      </View>
    );
  }

  const {
    Canvas,
    Circle,
    Line,
    LinearGradient,
    Path,
    Skia,
    vec,
  } = SkiaModules as NonNullable<typeof SkiaModules>;
  const strokeWidth = size === 'full' ? 3.5 : 2;
  const markerRadius = size === 'full' ? 6.5 : 3.5;
  const markerSmall = size === 'full' ? 3 : 0;
  const fillOpacity = Math.min(0.6, reveal);
  const gridColor = withAlpha(colors.textTertiary, 0.2);
  const showAllMarkers = size === 'full';
  const lastPoint = scaledPaths?.scaledPoints?.length
    ? scaledPaths.scaledPoints[scaledPaths.scaledPoints.length - 1]
    : null;
  const activeIndex = highlightIndex != null ? highlightIndex : hoverIndexRef.current;
  const activePoint = scaledPaths?.scaledPoints?.[activeIndex ?? -1] ?? null;
  const activeSecondaryPoint = scaledPaths?.scaledSecondaryPoints?.[activeIndex ?? -1] ?? null;

  return (
    <View style={chartStyle} onLayout={handleLayout}>
      {scaledPaths ? (
        <>
          <Canvas style={StyleSheet.absoluteFill}>
            {size === 'full' ? (
              <>
                <Line
                  p1={vec(0, scaledPaths.chartTop + (scaledPaths.chartBottom - scaledPaths.chartTop) * 0)}
                  p2={vec(effectiveLayout.width, scaledPaths.chartTop + (scaledPaths.chartBottom - scaledPaths.chartTop) * 0)}
                  color={gridColor}
                  strokeWidth={1}
                />
                <Line
                  p1={vec(0, scaledPaths.chartTop + (scaledPaths.chartBottom - scaledPaths.chartTop) * 0.25)}
                  p2={vec(effectiveLayout.width, scaledPaths.chartTop + (scaledPaths.chartBottom - scaledPaths.chartTop) * 0.25)}
                  color={gridColor}
                  strokeWidth={1}
                />
                <Line
                  p1={vec(0, scaledPaths.chartTop + (scaledPaths.chartBottom - scaledPaths.chartTop) * 0.5)}
                  p2={vec(effectiveLayout.width, scaledPaths.chartTop + (scaledPaths.chartBottom - scaledPaths.chartTop) * 0.5)}
                  color={gridColor}
                  strokeWidth={1}
                />
              </>
            ) : null}
            {scaledPaths.area ? (
              <Path
                path={scaledPaths.area}
                style="fill"
                start={0}
                end={reveal}
              >
                <LinearGradient
                  start={vec(0, scaledPaths.lineBounds.y)}
                  end={vec(0, scaledPaths.fillFadeY)}
                  colors={[
                    withAlpha(color, 0.28 * fillOpacity),
                    withAlpha(color, 0),
                  ]}
                  positions={[0, 1]}
                />
              </Path>
            ) : null}
            {scaledPaths.secondaryLine && secondaryColor ? (
              <Path
                path={scaledPaths.secondaryLine}
                style="stroke"
                color={withAlpha(secondaryColor, 0.85)}
                strokeWidth={strokeWidth * 0.9}
                strokeJoin="round"
                strokeCap="round"
                start={0}
                end={reveal}
              />
            ) : null}
            <Path
              path={scaledPaths.line}
              style="stroke"
              color={color}
              strokeWidth={strokeWidth}
              strokeJoin="round"
              strokeCap="round"
              start={0}
              end={reveal}
            />
            {showAllMarkers && markerSmall > 0
              ? scaledPaths.scaledPoints.map((point, index) => (
                  <Circle key={`pt-${index}`} cx={point.x} cy={point.y} r={markerSmall} color={color} />
                ))
              : null}
            {activePoint ? (
              <>
                <Circle cx={activePoint.x} cy={activePoint.y} r={markerRadius + 3} color={colors.surface} />
                <Circle cx={activePoint.x} cy={activePoint.y} r={markerRadius} color={color} />
              </>
            ) : null}
            {activeSecondaryPoint && secondaryColor ? (
              <>
                <Circle
                  cx={activeSecondaryPoint.x}
                  cy={activeSecondaryPoint.y}
                  r={markerRadius + 2}
                  color={colors.surface}
                />
                <Circle
                  cx={activeSecondaryPoint.x}
                  cy={activeSecondaryPoint.y}
                  r={markerRadius * 0.85}
                  color={secondaryColor}
                />
              </>
            ) : null}
            {!activePoint && lastPoint ? (
              <>
                <Circle cx={lastPoint.x} cy={lastPoint.y} r={markerRadius + 2} color={colors.surface} />
                <Circle cx={lastPoint.x} cy={lastPoint.y} r={markerRadius} color={color} />
              </>
            ) : null}
          </Canvas>
          {interactive ? <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} /> : null}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  chartCompact: {
    width: 90,
    height: 48,
  },
  chartFull: {
    width: '100%',
    height: '100%',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  emptyLine: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
  },
  emptyLineShort: {
    height: 6,
    width: '60%',
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
  },
});
