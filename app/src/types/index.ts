// Shared domain types mirroring the backend contract (Req 20.11).

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type ConsultationType = 'IN_PERSON' | 'VIDEO';

export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
}
