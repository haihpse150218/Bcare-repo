export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  VNPAY = "VNPAY",
  MOMO = "MOMO",
  CASH = "CASH",
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string | null;
  scheduleId: string;
  date: Date;
  timeSlot: string;
  status: AppointmentStatus;
  symptomNote: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amount: number | null;
  createdAt: Date;
}
