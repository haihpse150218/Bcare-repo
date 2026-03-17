import { z } from "zod";

export const createConversationSchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
}).refine((data) => data.doctorId || data.patientId, {
  message: "doctorId hoặc patientId là bắt buộc",
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Nội dung không được để trống").max(2000, "Nội dung tối đa 2000 ký tự"),
  type: z.enum(["TEXT", "IMAGE", "FILE"]).default("TEXT"),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
