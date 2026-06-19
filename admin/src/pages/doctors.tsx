import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VerificationBadge, UserStatusBadge } from '@/components/status-badge';
import { useDoctors } from '@/hooks/use-doctors';
import { config } from '@/constants/config';

/** Doctor management: paginated, filterable, searchable list (Req 17.6). */
export function DoctorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDoctors({
    search: search || undefined,
    status: status || undefined,
    page,
    pageSize: config.defaultPageSize,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
        <Button asChild>
          <Link to="/doctors/new">
            <Plus className="h-4 w-4" /> Register doctor
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No doctors found.
              </TableCell>
            </TableRow>
          )}
          {data?.items.map((doc) => (
            <TableRow
              key={doc.id}
              className="cursor-pointer"
              onClick={() => navigate(`/doctors/${doc.id}`)}
            >
              <TableCell className="font-medium">
                {doc.name ?? '—'}
                <div className="text-xs text-muted-foreground">{doc.email}</div>
              </TableCell>
              <TableCell>{doc.phone}</TableCell>
              <TableCell>{doc.specialization ?? '—'}</TableCell>
              <TableCell>
                <UserStatusBadge status={doc.status} />
              </TableCell>
              <TableCell>
                <VerificationBadge status={doc.verificationStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} doctor{data.total === 1 ? '' : 's'} · page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
