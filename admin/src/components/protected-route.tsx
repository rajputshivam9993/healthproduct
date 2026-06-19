import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Route guard verifying an authenticated session with the ADMIN role before
 * rendering protected pages (Req 17.3, 17.4, 17.13). Non-authenticated users are
 * redirected to login; authenticated non-admins are shown an unauthorized notice.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Unauthorized — admin access required.</p>
      </div>
    );
  }

  return <>{children}</>;
}
