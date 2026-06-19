import { NavLink } from 'react-router-dom';
import { CalendarClock, LayoutDashboard, Stethoscope, CalendarDays, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fixed sidebar navigation linking all management sections (Req 19.1).
const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope, end: false },
  { to: '/appointments', label: 'Appointments', icon: CalendarClock, end: false },
  { to: '/slots', label: 'Slots', icon: CalendarDays, end: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
];

/** Sidebar; collapses to an icon-only rail when `collapsed` (Req 19.11). */
export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-16 items-center text-lg font-bold text-primary', collapsed ? 'justify-center px-0' : 'px-6')}>
        {collapsed ? 'D' : 'Doctor360'}
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
