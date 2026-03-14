import { VerificationStatus } from "./user";

export interface Clinic {
  id: string;
  userId: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  city: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  description: string | null;
  images: string[];
  operatingHours: Record<string, string> | null;
  verificationStatus: VerificationStatus;
}
