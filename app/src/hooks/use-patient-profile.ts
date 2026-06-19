import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, type UpdatePatientPayload } from '../services/user-service';

export function usePatientProfile() {
  return useQuery({ queryKey: ['me'], queryFn: userService.getMe });
}

export function useUpdatePatientProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePatientPayload) => userService.updateMe(payload),
    onSuccess: (data) => qc.setQueryData(['me'], data),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => userService.uploadAvatar(uri),
    onSuccess: (data) => qc.setQueryData(['me'], data),
  });
}
