import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { api } from '../../../shared/api/client';

type UploadOptions = {
  folder?: string;
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

const resizeImageIfNeeded = async (asset: ImagePicker.ImagePickerAsset) => {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  if (!width || !height) {
    return asset.uri;
  }
  const maxSide = Math.max(width, height);
  if (maxSide <= MAX_DIMENSION) {
    return asset.uri;
  }
  const scale = MAX_DIMENSION / maxSide;
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);
  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: targetWidth, height: targetHeight } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

export const usePhotoUpload = () => {
  const pickAndUpload = useCallback(
    async (setter: (uri: string | null) => void, options: UploadOptions = {}) => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const resizedUri = await resizeImageIfNeeded(asset);
      const localUri = resizedUri;
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'measurement.jpg';
      const contentType = 'image/jpeg';
      const folder = options.folder ?? 'measurements';

      try {
        const presign = await api.post('/storage/presign', {
          fileName,
          contentType,
          folder,
        });

        const uploadUrl = presign.data.uploadUrl;
        const publicUrl = presign.data.publicUrl;
        const fileResponse = await fetch(localUri);
        const blob = await fileResponse.blob();
        if (blob.size > MAX_UPLOAD_BYTES) {
          throw new Error('FILE_TOO_LARGE');
        }

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: blob,
        });

        setter(publicUrl);
      } catch (error) {
        if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
          console.warn('Photo too large to upload');
          throw error;
        }
        console.warn('Photo upload failed, using local uri', error);
        setter(localUri);
      }
    },
    []
  );

  return { pickAndUpload };
};
