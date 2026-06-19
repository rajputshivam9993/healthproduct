import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { FileText, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationBadge, UserStatusBadge } from '@/components/status-badge';
import { useDoctor, useDoctorStatus } from '@/hooks/use-doctors';
import { config } from '@/constants/config';
import type { DoctorAction } from '@/types';

/** Doctor detail with profile, document, and admin status actions (Req 17.7). */
export function DoctorDetailPage() {
  const { id } = useParams();
  const { data: doctor, isLoading } = useDoctor(id);
  const statusMutation = useDoctorStatus(id ?? '');

  const act = async (action: DoctorAction) => {
    try {
      await statusMutation.mutateAsync(action);
      toast.success(`Doctor ${action.toLowerCase()}d`);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data as { message?: string })?.message ?? 'Action failed')
          : 'Action failed';
      toast.error(message);
    }
  };

  if (isLoading || !doctor) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const fileUrl = doctor.documentUrl ? `${config.apiBaseUrl.replace('/api', '')}${doctor.documentUrl}` : null;

  const facts: Array<[string, string]> = [
    ['Email', doctor.user.email ?? '—'],
    ['Phone', doctor.user.phone],
    ['Specialization', doctor.specialization ?? '—'],
    ['Experience', `${doctor.experienceYears} yrs`],
    ['Consultation fee', doctor.consultationFee ? `₹${doctor.consultationFee}` : '—'],
    ['Qualification', doctor.qualification ?? '—'],
    ['Degree', doctor.degree ?? '—'],
    ['Reg. number', doctor.medicalRegNumber ?? '—'],
    ['Clinic', doctor.clinicAddress ?? '—'],
    ['City', doctor.city ?? '—'],
    ['State', doctor.state ?? '—'],
  ];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Doctors', to: '/doctors' }, { label: doctor.user.name ?? 'Doctor' }]} />


      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{doctor.user.name ?? 'Doctor'}</h1>
          <div className="mt-1 flex items-center gap-2">
            <UserStatusBadge status={doctor.user.status} />
            <VerificationBadge status={doctor.verificationStatus} />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {doctor.avgRating} ({doctor.totalReviews})
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => act('APPROVE')} disabled={statusMutation.isPending}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => act('REJECT')} disabled={statusMutation.isPending}>
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => act('ACTIVATE')} disabled={statusMutation.isPending}>
            Activate
          </Button>
          <Button size="sm" variant="outline" onClick={() => act('DEACTIVATE')} disabled={statusMutation.isPending}>
            Deactivate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          {doctor.bio && <p className="mt-4 text-sm text-muted-foreground">{doctor.bio}</p>}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="h-4 w-4" /> View medical document
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
