import { apiClient } from './api/client';

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

/** Chat + notifications API (Req 12, 13). Real-time is via Socket.io on the server;
 * the app polls history here to stay simple inside Expo Go. */
export const chatService = {
  history(appointmentId: string): Promise<ChatMessage[]> {
    return apiClient.get(`/chats/${appointmentId}`).then((r) => r.data);
  },
  send(appointmentId: string, content: string): Promise<ChatMessage> {
    return apiClient.post('/chats', { appointmentId, content }).then((r) => r.data);
  },
};
