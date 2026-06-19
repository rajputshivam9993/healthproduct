import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/** Fallback 404 page. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Button asChild>
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
