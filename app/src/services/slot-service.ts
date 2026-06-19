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

/** Doctor availability slot API (Req 6, 21.4, 21.8). */
export const slotService = {
  listMine(from: string, to: string): Promise<Slot[]> {
    return apiClient.get('/doctors/me/slots', { params: { from, to } }).then((r) => r.data);
  },
  createMine(payload: CreateSlotPayload): Promise<Slot> {
    return apiClient.post('/doctors/me/slots', payload).then((r) => r.data);
  },
  deleteMine(id: string): Promise<void> {
    return apiClient.delete(`/doctors/me/slots/${id}`).then(() => undefined);
  },
};
