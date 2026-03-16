import { z } from "zod";

export const createPaymentSchema = z.object({
  method: z.enum(["VNPAY", "MOMO"], { required_error: "Vui lòng chọn phương thức thanh toán" }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
