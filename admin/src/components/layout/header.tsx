import { Bell, LogOut, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

// Top header: sidebar toggle + admin identity + notification bell + logout (Req 19.1, 19.11).
export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, clearSession } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
          <PanelLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">Admin Portal</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{user?.name ?? user?.email ?? 'Admin'}</span>
        <Button variant="ghost" size="icon" aria-label="Log out" onClick={clearSession}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
