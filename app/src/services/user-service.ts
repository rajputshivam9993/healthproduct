import { apiClient } from './api/client';

export interface PatientProfile {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  avatarUrl: string | null;
}

export interface UpdatePatientPayload {
  name?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
}

/** Patient profile API (Req 4.1). */
export const userService = {
  getMe(): Promise<PatientProfile> {
    return apiClient.get('/users/me').then((r) => r.data);
  },
  updateMe(payload: UpdatePatientPayload): Promise<PatientProfile> {
    return apiClient.patch('/users/me', payload).then((r) => r.data);
  },
  uploadAvatar(uri: string): Promise<PatientProfile> {
    const form = new FormData();
    const name = uri.split('/').pop() ?? 'avatar.jpg';
    const ext = name.split('.').pop()?.toLowerCase();
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';
    // React Native FormData file shape.
    form.append('avatar', { uri, name, type } as unknown as Blob);
    return apiClient
      .post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};
