import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppointmentStatusBadge } from '@/components/status-badge';
import { useAdminAppointments } from '@/hooks/use-analytics';
import { config } from '@/constants/config';

/** Admin appointments list with status / date-range filters (Req 17.10). */
export function AppointmentsPage() {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminAppointments({
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: config.defaultPageSize,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>

      <div className="flex flex-wrap items-end gap-3">
        <Select className="w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </Select>
        <Input type="date" className="w-44" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <Input type="date" className="w-44" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date & time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          )}
          {!isLoading && data?.items.length === 0 && (
            <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No appointments found.</TableCell></TableRow>
          )}
          {data?.items.map((appt) => (
            <TableRow key={appt.id}>
              <TableCell className="font-medium">{appt.patient?.name ?? '—'}</TableCell>
              <TableCell>{appt.doctor?.user?.name ?? '—'}</TableCell>
              <TableCell>{new Date(appt.scheduledStart).toLocaleString()}</TableCell>
              <TableCell>{appt.consultationType.replace('_', ' ')}</TableCell>
              <TableCell><AppointmentStatusBadge status={appt.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} appointments · page {data.page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
