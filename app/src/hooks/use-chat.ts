import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat-service';

export function useChatHistory(appointmentId: string) {
  return useQuery({
    queryKey: ['chat', appointmentId],
    queryFn: () => chatService.history(appointmentId),
    // Poll for new messages (Socket.io delivers server-side; polling keeps Expo Go simple).
    refetchInterval: 4000,
  });
}

export function useSendMessage(appointmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => chatService.send(appointmentId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', appointmentId] }),
  });
}
