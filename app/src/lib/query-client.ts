import { QueryClient } from '@tanstack/react-query';
import { config } from '../constants/config';

// Shared React Query client (Req 16.1/16.3). Mutations retry up to the configured
// count so pending writes sync when connectivity returns.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.defaultStaleTime,
      retry: 2,
    },
    mutations: {
      retry: config.mutationRetry,
    },
  },
});
