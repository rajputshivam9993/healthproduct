import { useQuery } from '@tanstack/react-query';
import { doctorService, type SearchParams } from '../services/doctor-service';

/** Patient doctor search query (Req 5). */
export function useDoctorSearch(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['doctor-search', params],
    queryFn: () => doctorService.search(params),
    enabled,
  });
}
