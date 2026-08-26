import { httpClient } from '@/shared/lib/axios';
import type { MediaFile, Paginated } from '@/shared/types';

export interface MediaParams {
  page?: number;
}

// Bibliotheque media (roadmap MVP) : upload, liste et suppression de fichiers
// images/documents. Endpoint /media/ (voir apps/media/urls.py cote backend).
export const mediaApi = {
  list: (params: MediaParams = {}) =>
    httpClient.get<Paginated<MediaFile>>('/media/', { params }).then((r) => r.data),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Le Content-Type est laisse vide : le navigateur fixe seul le boundary.
    return httpClient.post<MediaFile>('/media/', formData).then((r) => r.data);
  },
  remove: (id: number) => httpClient.delete(`/media/${id}/`),
};