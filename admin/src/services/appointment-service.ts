import { apiClient } from './api/client';
import type { AppointmentStatus, Paginated } from '@/types';

export interface AdminAppointment {
  id: string;
  status: AppointmentStatus;
  consultationType: 'IN_PERSON' | 'VIDEO';
  scheduledStart: string;
  patient?: { name: string | null };
  doctor?: { user?: { name: string | null } };
}

export interface AppointmentFilters {
  status?: string;
  doctorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/** Admin appointment list API (Req 17.10). */
export const appointmentService = {
  list(filters: AppointmentFilters): Promise<Paginated<AdminAppointment>> {
    return apiClient.get('/appointments', { params: filters }).then((r) => r.data);
  },
};
