import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';

// App root: React Query provider + router + toast host (Req 17.1, 19.9).
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
