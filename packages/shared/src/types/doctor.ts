import { VerificationStatus } from "./user";

export interface Doctor {
  id: string;
  userId: string;
  clinicId: string | null;
  specialtyId: string;
  slug: string;
  title: string;
  bio: string | null;
  experienceYears: number;
  consultationFee: number;
  ratingAvg: number;
  isAvailable: boolean;
  verificationStatus: VerificationStatus;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

export interface Schedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}
