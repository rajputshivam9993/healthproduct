import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  patientDetailService,
  type CreatePatientDetailPayload,
} from '../services/patient-detail-service';

export function usePatientDetails() {
  return useQuery({
    queryKey: ['patient-details'],
    queryFn: patientDetailService.list,
  });
}

export function useCreatePatientDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePatientDetailPayload) => patientDetailService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-details'] });
    },
  });
}
