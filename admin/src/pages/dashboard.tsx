import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarCheck, Stethoscope, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/use-analytics';

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: '#F5A623',
  CONFIRMED: '#1E6FE8',
  IN_PROGRESS: '#0E8A57',
  COMPLETED: '#20B486',
  CANCELLED: '#E5484D',
};

/** Analytics dashboard with stat cards + charts (Req 17.11, 19.5). */
export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const statusData = data
    ? Object.entries(data.appointmentsByStatus).map(([status, count]) => ({ status: status.replace('_', ' '), count, key: status }))
    : [];

  const cards = [
    { label: 'Doctors', value: data?.totalDoctors ?? 0, icon: Stethoscope, color: 'text-primary' },
    { label: 'Patients', value: data?.totalPatients ?? 0, icon: Users, color: 'text-emerald-600' },
    { label: 'Appointments', value: data?.totalAppointments ?? 0, icon: CalendarCheck, color: 'text-blue-600' },
    { label: 'Last 30 days', value: data?.last30DaysCount ?? 0, icon: TrendingUp, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-lg bg-muted p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{isLoading ? '…' : value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.dailyTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1E6FE8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments by status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#1E6FE8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
