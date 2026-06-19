import { apiClient } from './api/client';

/** Patient review submission (Req 11). */
export const reviewService = {
  create(appointmentId: string, rating: number, comment?: string): Promise<unknown> {
    return apiClient.post('/reviews', { appointmentId, rating, comment }).then((r) => r.data);
  },
};
