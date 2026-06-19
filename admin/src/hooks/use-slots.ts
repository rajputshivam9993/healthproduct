import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slotService, type CreateSlotPayload } from '@/services/slot-service';

export function useDoctorSlots(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['slots', doctorId],
    queryFn: () => slotService.listForDoctor(doctorId as string),
    enabled: Boolean(doctorId),
  });
}

export function useCreateSlot(doctorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSlotPayload) => slotService.create(doctorId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots', doctorId] }),
  });
}

export function useDeleteSlot(doctorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => slotService.remove(slotId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots', doctorId] }),
  });
}
