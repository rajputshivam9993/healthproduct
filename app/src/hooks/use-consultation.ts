import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment-service';
import { prescriptionService, type Medication } from '../services/prescription-service';

export function useAppointment(id: string) {
  return useQuery({ queryKey: ['appointment', id], queryFn: () => appointmentService.getOne(id) });
}

export function useCompleteConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.complete(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useCreatePrescription() {
  return useMutation({
    mutationFn: (vars: { appointmentId: string; medications: Medication[]; notes?: string }) =>
      prescriptionService.create(vars.appointmentId, vars.medications, vars.notes),
  });
}
