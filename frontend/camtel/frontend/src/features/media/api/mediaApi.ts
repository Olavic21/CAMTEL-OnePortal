import { httpClient } from '@/shared/lib/axios';
import type { MediaFile, Paginated } from '@/shared/types';

// Section 8.6 de la documentation API.
export const mediaApi = {
  list: (params: { file_type?: string } = {}) =>
    httpClient.get<Paginated<MediaFile>>('/media/', { params }).then((r) => r.data),
  upload: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient
      .post<MediaFile>('/media/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  remove: (id: number) => httpClient.delete(`/media/${id}/`),
};
