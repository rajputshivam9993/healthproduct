import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorService, type DoctorListParams } from '@/services/doctor-service';
import type { DoctorAction } from '@/types';

// React Query hooks keep data-fetching out of components (Req 20.12).

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorService.list(params),
  });
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.detail(id as string),
    enabled: Boolean(id),
  });
}

export function useRegisterDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => doctorService.register(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useDoctorStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: DoctorAction) => doctorService.setStatus(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      qc.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}
