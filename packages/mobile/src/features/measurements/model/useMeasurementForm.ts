import { useEffect, useMemo, useState } from 'react';

import { MeasurementEntry } from '../repositories/MeasurementsRepository';

type UseMeasurementFormParams = {
  visible: boolean;
  initialData?: Partial<MeasurementEntry> | null;
};

const toText = (value?: number | null) => (value == null ? '' : value.toString());

export const useMeasurementForm = ({ visible, initialData }: UseMeasurementFormParams) => {
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftLeg, setLeftLeg] = useState('');
  const [rightLeg, setRightLeg] = useState('');
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<string | null>(null);
  const [photoBack, setPhotoBack] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setWeight(toText(initialData.weight));
      setChest(toText(initialData.chest));
      setWaist(toText(initialData.waist));
      setHips(toText(initialData.hips));
      setLeftArm(toText(initialData.leftArm));
      setRightArm(toText(initialData.rightArm));
      setLeftLeg(toText(initialData.leftLeg));
      setRightLeg(toText(initialData.rightLeg));
      setPhotoFront(initialData.photoFront ?? null);
      setPhotoSide(initialData.photoSide ?? null);
      setPhotoBack(initialData.photoBack ?? null);
    } else {
      setWeight('');
      setChest('');
      setWaist('');
      setHips('');
      setLeftArm('');
      setRightArm('');
      setLeftLeg('');
      setRightLeg('');
      setPhotoFront(null);
      setPhotoSide(null);
      setPhotoBack(null);
    }
  }, [initialData, visible]);

  const payload = useMemo<Partial<MeasurementEntry>>(
    () => ({
      weight: parseFloat(weight) || null,
      chest: parseFloat(chest) || null,
      waist: parseFloat(waist) || null,
      hips: parseFloat(hips) || null,
      leftArm: parseFloat(leftArm) || null,
      rightArm: parseFloat(rightArm) || null,
      leftLeg: parseFloat(leftLeg) || null,
      rightLeg: parseFloat(rightLeg) || null,
      photoFront,
      photoSide,
      photoBack,
    }),
    [
      weight,
      chest,
      waist,
      hips,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      photoFront,
      photoSide,
      photoBack,
    ]
  );

  return {
    weight,
    chest,
    waist,
    hips,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    photoFront,
    photoSide,
    photoBack,
    setWeight,
    setChest,
    setWaist,
    setHips,
    setLeftArm,
    setRightArm,
    setLeftLeg,
    setRightLeg,
    setPhotoFront,
    setPhotoSide,
    setPhotoBack,
    payload,
  };
};
