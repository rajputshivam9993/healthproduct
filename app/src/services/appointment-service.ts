import { apiClient } from './api/client';
import type { Slot } from './slot-service';

export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  consultationType: 'IN_PERSON' | 'VIDEO';
  scheduledStart: string;
  scheduledEnd: string;
  doctor?: { user?: { name: string | null } };
  patient?: { name: string | null };
}

export interface BookResponse {
  appointment: Appointment;
  order: { orderId: string; amount: number; currency: string; mock: boolean };
}

/** Patient appointment + payment API (Req 7, 8). */
export const appointmentService = {
  availableSlots(doctorId: string, from: string, to: string): Promise<Slot[]> {
    return apiClient
      .get(`/doctors/${doctorId}/available-slots`, { params: { from, to } })
      .then((r) => r.data);
  },
  book(slotId: string, patientDetailId?: string): Promise<BookResponse> {
    return apiClient.post('/appointments', { slotId, patientDetailId }).then((r) => r.data);
  },
  confirmPayment(appointmentId: string): Promise<Appointment> {
    return apiClient.post('/payments/confirm', { appointmentId }).then((r) => r.data);
  },
  list(): Promise<Appointment[]> {
    // Backend returns a paginated envelope; the app shows the patient's own list.
    return apiClient.get('/appointments').then((r) => r.data.items);
  },
  getOne(id: string): Promise<Appointment & { patient?: { name: string | null; dateOfBirth?: string | null; gender?: string | null; bloodGroup?: string | null; allergies?: string | null } }> {
    return apiClient.get(`/appointments/${id}`).then((r) => r.data);
  },
  cancel(id: string): Promise<Appointment> {
    return apiClient.patch(`/appointments/${id}/cancel`).then((r) => r.data);
  },
  // Video consultation (Req 9).
  start(id: string): Promise<{ appointment: Appointment; agora: AgoraCredentials | null }> {
    return apiClient.post(`/appointments/${id}/start`).then((r) => r.data);
  },
  complete(id: string): Promise<Appointment> {
    return apiClient.patch(`/appointments/${id}/complete`).then((r) => r.data);
  },
};

export interface AgoraCredentials {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  expiresInSeconds: number;
  mock: boolean;
}
