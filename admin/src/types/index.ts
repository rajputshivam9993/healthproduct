// Shared domain types mirroring the backend contract (Req 20.11).

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminUser {
  id: string;
  role: UserRole;
  name: string | null;
  email: string | null;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

/** Row shape from GET /doctors (Req 17.6). */
export interface DoctorListItem {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  phone: string;
  specialization: string | null;
  status: UserStatus;
  verificationStatus: VerificationStatus;
}

/** Full doctor profile from GET /doctors/:id (Req 17.7). */
export interface DoctorDetail {
  id: string;
  specialization: string | null;
  experienceYears: number;
  consultationFee: string | null;
  qualification: string | null;
  degree: string | null;
  medicalRegNumber: string | null;
  clinicAddress: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  latitude: string | null;
  longitude: string | null;
  documentUrl: string | null;
  verificationStatus: VerificationStatus;
  avgRating: string;
  totalReviews: number;
  user: { id: string; name: string | null; email: string | null; phone: string; status: UserStatus };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type DoctorAction = 'APPROVE' | 'REJECT' | 'ACTIVATE' | 'DEACTIVATE';
