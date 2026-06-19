import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';

// Shell layout wrapping all authenticated admin pages (Req 19.1). The sidebar
// collapses to an icon rail below 1024px and via the header toggle (Req 19.11).
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const apply = () => setCollapsed(window.innerWidth < 1024);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
