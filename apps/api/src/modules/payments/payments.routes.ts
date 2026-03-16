import { FastifyInstance } from "fastify";
import {
  createPaymentController,
  vnpayCallbackController,
  vnpayIPNController,
  momoCallbackController,
  momoIPNController,
  paymentHistoryController,
  paymentDetailController,
} from "./payments.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, createPaymentSchema } from "@bcare/shared";

export async function paymentsRoutes(app: FastifyInstance) {
  app.post<{ Params: { appointmentId: string }; Body: { method: "VNPAY" | "MOMO" } }>(
    "/api/payments/:appointmentId/create",
    { preHandler: [authenticate, authorize(Role.PATIENT), validate(createPaymentSchema)] },
    createPaymentController
  );

  app.get("/api/payments/vnpay/callback", vnpayCallbackController);
  app.get("/api/payments/momo/callback", momoCallbackController);

  // VNPay IPN uses GET with query params
  app.get("/api/payments/vnpay/ipn", vnpayIPNController);
  // MoMo IPN uses POST with body
  app.post("/api/payments/momo/ipn", momoIPNController);

  app.get<{ Querystring: { page?: string; limit?: string } }>("/api/payments/history", { preHandler: [authenticate] }, paymentHistoryController);
  app.get<{ Params: { id: string } }>("/api/payments/:id", { preHandler: [authenticate] }, paymentDetailController);
}
