import { z } from "zod";
import { AppointmentStatus, PaymentMethod } from "../types";

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (YYYY-MM-DD)"),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Giờ không hợp lệ (HH:mm)"),
  symptomNote: z.string().max(500).optional(),
  paymentMethod: z.enum([PaymentMethod.VNPAY, PaymentMethod.MOMO, PaymentMethod.CASH]).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum([
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
  ]),
});

export const listAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
