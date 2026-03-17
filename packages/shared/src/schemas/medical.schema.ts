import { z } from "zod";

export const createMedicalNoteSchema = z.object({
  appointmentId: z.string().uuid("ID lịch hẹn không hợp lệ"),
  diagnosis: z.string().min(1, "Chẩn đoán không được để trống").max(2000, "Chẩn đoán tối đa 2000 ký tự"),
  prescription: z.string().max(2000, "Đơn thuốc tối đa 2000 ký tự").optional(),
  notes: z.string().max(2000, "Ghi chú tối đa 2000 ký tự").optional(),
  followUpDate: z.string().datetime({ message: "Ngày tái khám không hợp lệ" }).optional(),
});

export const updateMedicalNoteSchema = z.object({
  diagnosis: z.string().min(1).max(2000).optional(),
  prescription: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  followUpDate: z.string().datetime().nullable().optional(),
});

export const updatePatientProfileSchema = z.object({
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  allergies: z.array(z.string().max(100)).max(20).optional(),
  conditions: z.array(z.string().max(100)).max(20).optional(),
  medications: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateMedicalNoteInput = z.infer<typeof createMedicalNoteSchema>;
export type UpdateMedicalNoteInput = z.infer<typeof updateMedicalNoteSchema>;
export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;
