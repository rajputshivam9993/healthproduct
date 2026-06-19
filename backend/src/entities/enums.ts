// Shared domain enums used across entities and DTOs. Kept in one file so the
// canonical string values live in a single place (Req 20.8).

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ConsultationType {
  IN_PERSON = 'IN_PERSON',
  VIDEO = 'VIDEO',
}

export enum AppointmentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  REFUND_FAILED = 'REFUND_FAILED',
}

export enum NotificationType {
  APPOINTMENT_UPDATE = 'APPOINTMENT_UPDATE',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}
