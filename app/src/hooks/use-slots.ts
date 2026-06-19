import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slotService, type CreateSlotPayload } from '../services/slot-service';

const RANGE_DAYS = 30;

function range() {
  const from = new Date().toISOString();
  const to = new Date(Date.now() + RANGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

export function useMySlots() {
  const { from, to } = range();
  return useQuery({ queryKey: ['my-slots'], queryFn: () => slotService.listMine(from, to) });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSlotPayload) => slotService.createMine(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-slots'] }),
  });
}

export function useDeleteSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slotService.deleteMine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-slots'] }),
  });
}
