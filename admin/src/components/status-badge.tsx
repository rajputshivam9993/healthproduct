import { Badge } from '@/components/ui/badge';
import type { AppointmentStatus, UserStatus, VerificationStatus } from '@/types';

// Maps domain statuses to color-coded badge variants (Req 19.8).
const verificationVariant: Record<VerificationStatus, 'success' | 'warning' | 'danger'> = {
  VERIFIED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
};

const userStatusVariant: Record<UserStatus, 'success' | 'muted'> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
};

const appointmentVariant: Record<AppointmentStatus, 'warning' | 'info' | 'default' | 'success' | 'danger'> = {
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge variant={verificationVariant[status]}>{status}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={userStatusVariant[status]}>{status}</Badge>;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={appointmentVariant[status]}>{status.replace('_', ' ')}</Badge>;
}
