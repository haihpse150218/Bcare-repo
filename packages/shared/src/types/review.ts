export interface Review {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}
