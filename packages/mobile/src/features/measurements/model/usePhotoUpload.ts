import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../../../shared/api/client';

type UploadOptions = {
  folder?: string;
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
      const localUri = asset.uri;
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'measurement.jpg';
      const contentType = asset.mimeType ?? 'image/jpeg';
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

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: blob,
        });

        setter(publicUrl);
      } catch (error) {
        console.warn('Photo upload failed, using local uri', error);
        setter(localUri);
      }
    },
    []
  );

  return { pickAndUpload };
};
