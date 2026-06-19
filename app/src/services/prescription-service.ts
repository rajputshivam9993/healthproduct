import { apiClient } from './api/client';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  medications: Medication[];
  notes: string | null;
  createdAt: string;
}

export interface PaginatedPrescriptions {
  items: Prescription[];
  total: number;
  page: number;
  pageSize: number;
}

/** Prescription API — doctor creates (Req 10.1), patient views history (Req 10.3). */
export const prescriptionService = {
  create(appointmentId: string, medications: Medication[], notes?: string): Promise<Prescription> {
    return apiClient.post('/prescriptions', { appointmentId, medications, notes }).then((r) => r.data);
  },
  myHistory(): Promise<PaginatedPrescriptions> {
    return apiClient.get('/prescriptions').then((r) => r.data);
  },
};
