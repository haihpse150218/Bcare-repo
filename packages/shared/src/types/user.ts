export enum Role {
  PATIENT = "PATIENT",
  DOCTOR = "DOCTOR",
  CLINIC = "CLINIC",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserPublic = Omit<User, "createdAt" | "updatedAt">;
