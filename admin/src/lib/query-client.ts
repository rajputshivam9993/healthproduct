import { QueryClient } from '@tanstack/react-query';

// Shared React Query client for the admin portal data layer (Req 20.6, 20.12).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});
