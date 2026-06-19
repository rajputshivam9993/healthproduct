import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment-service';

const RANGE_DAYS = 30;

export function useAvailableSlots(doctorId: string) {
  const from = new Date().toISOString();
  const to = new Date(Date.now() + RANGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return useQuery({
    queryKey: ['available-slots', doctorId],
    queryFn: () => appointmentService.availableSlots(doctorId, from, to),
  });
}

export function useAppointments() {
  return useQuery({ queryKey: ['appointments'], queryFn: appointmentService.list });
}

export function useBookAndPay() {
  const qc = useQueryClient();
  return useMutation({
    // Books the slot then (dev) confirms payment so the appointment is CONFIRMED.
    mutationFn: async (slotId: string) => {
      const { appointment } = await appointmentService.book(slotId);
      return appointmentService.confirmPayment(appointment.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    // Optimistic update: flip status to CANCELLED immediately, roll back on error (Req 16.4).
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['appointments'] });
      const previous = qc.getQueryData(['appointments']);
      qc.setQueryData(['appointments'], (old: unknown) =>
        Array.isArray(old)
          ? old.map((a) => (a && (a as { id: string }).id === id ? { ...a, status: 'CANCELLED' } : a))
          : old,
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(['appointments'], context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
