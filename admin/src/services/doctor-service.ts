import { apiClient } from './api/client';
import type { DoctorAction, DoctorDetail, DoctorListItem, Paginated } from '@/types';

export interface DoctorListParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Admin doctor management + registration API calls (Req 2, 17.5-17.7). */
export const doctorService = {
  list(params: DoctorListParams): Promise<Paginated<DoctorListItem>> {
    return apiClient.get('/doctors', { params }).then((r) => r.data);
  },

  detail(id: string): Promise<DoctorDetail> {
    return apiClient.get(`/doctors/${id}`).then((r) => r.data);
  },

  // Multipart registration with optional document file (Req 2.1, 2.2).
  register(form: FormData): Promise<unknown> {
    return apiClient.post('/auth/doctors', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  setStatus(id: string, action: DoctorAction): Promise<DoctorDetail> {
    return apiClient.patch(`/doctors/${id}/status`, { action }).then((r) => r.data);
  },
};
