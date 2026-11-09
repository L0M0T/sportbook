export const ROLES = {
  CLIENT: "CLIENT",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const BOOKING_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  ATTENDED: "ATTENDED",
  NO_SHOW: "NO_SHOW",
} as const;

export const TRAINING_STATUS = {
  SCHEDULED: "SCHEDULED",
  CANCELLED: "CANCELLED",
} as const;

export const OTP = {
  TTL_MINUTES: 5,
  MAX_ATTEMPTS: 5,
  MAX_PER_WINDOW: 3,
  WINDOW_MINUTES: 15,
} as const;

export const CANCELLATION_HOURS = 2;

export const STAFF_ROLES: Role[] = [ROLES.MANAGER, ROLES.ADMIN];
