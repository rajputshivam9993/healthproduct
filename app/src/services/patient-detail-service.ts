import { apiClient } from './api/client';

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface PatientDetail {
  id: string;
  name: string;
  age: number;
  gender: PatientGender;
  createdAt: string;
}

export interface CreatePatientDetailPayload {
  name: string;
  age: number;
  gender: PatientGender;
}

/** Patient details API — manage patient profiles for booking. */
export const patientDetailService = {
  list(): Promise<PatientDetail[]> {
    return apiClient.get('/patient-details').then((r) => r.data);
  },
  create(payload: CreatePatientDetailPayload): Promise<PatientDetail> {
    return apiClient.post('/patient-details', payload).then((r) => r.data);
  },
};
