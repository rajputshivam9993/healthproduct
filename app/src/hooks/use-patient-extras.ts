import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prescriptionService } from '../services/prescription-service';
import { reviewService } from '../services/review-service';

export function useMyPrescriptions() {
  return useQuery({ queryKey: ['prescriptions'], queryFn: prescriptionService.myHistory });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { appointmentId: string; rating: number; comment?: string }) =>
      reviewService.create(vars.appointmentId, vars.rating, vars.comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
