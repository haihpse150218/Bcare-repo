import { z } from "zod";

export const createReviewSchema = z.object({
  appointmentId: z.string().uuid("ID lịch hẹn không hợp lệ"),
  rating: z.number().int().min(1, "Đánh giá tối thiểu 1 sao").max(5, "Đánh giá tối đa 5 sao"),
  comment: z.string().max(500, "Nhận xét tối đa 500 ký tự").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
