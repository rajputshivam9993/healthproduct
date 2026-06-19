import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  doctorService,
  type UpdateDoctorProfilePayload,
} from '../services/doctor-service';

// Keeps data-fetching/mutation out of the screen component (Req 20.12).
export function useMyDoctorProfile() {
  return useQuery({ queryKey: ['doctor', 'me'], queryFn: doctorService.getMyProfile });
}

export function useUpdateMyDoctorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDoctorProfilePayload) => doctorService.updateMyProfile(payload),
    onSuccess: (data) => qc.setQueryData(['doctor', 'me'], data),
  });
}
