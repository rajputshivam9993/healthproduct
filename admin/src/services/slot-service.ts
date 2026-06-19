import { apiClient } from './api/client';

export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  consultationType: 'IN_PERSON' | 'VIDEO';
  isBooked: boolean;
}

export interface CreateSlotPayload {
  startTime: string;
  endTime: string;
  consultationType: 'IN_PERSON' | 'VIDEO';
}

// 30-day window covering the requirement's max range (Req 6.8).
function defaultRange() {
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

/** Admin availability-slot API (Req 17.8, 17.9). */
export const slotService = {
  listForDoctor(doctorId: string): Promise<Slot[]> {
    return apiClient.get(`/doctors/${doctorId}/slots`, { params: defaultRange() }).then((r) => r.data);
  },
  create(doctorId: string, payload: CreateSlotPayload): Promise<Slot> {
    return apiClient.post(`/doctors/${doctorId}/slots`, payload).then((r) => r.data);
  },
  remove(slotId: string): Promise<void> {
    return apiClient.delete(`/slots/${slotId}`).then(() => undefined);
  },
};
