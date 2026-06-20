import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../services/doctor-service';

/** Fetches the list of specializations from the backend. */
export function useSpecializations() {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorService.getSpecializations(),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24h — rarely changes.
  });
}
