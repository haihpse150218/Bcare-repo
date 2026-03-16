import { FastifyRequest, FastifyReply } from "fastify";
import { paymentsService } from "./payments.service";
import { verifyVNPaySignature } from "./gateways/vnpay";
import { verifyMoMoSignature } from "./gateways/momo";
import { success } from "../../lib/response";

export async function createPaymentController(
  request: FastifyRequest<{ Params: { appointmentId: string }; Body: { method: "VNPAY" | "MOMO" } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const ip = request.ip || "127.0.0.1";
    const result = await paymentsService.createPayment(id, request.params.appointmentId, request.body.method, ip);
    reply.send(success(result));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function vnpayCallbackController(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const responseCode = request.query.vnp_ResponseCode;
  const txnRef = request.query.vnp_TxnRef;
  reply.redirect(`${process.env.WEB_URL || "http://localhost:3000"}/payment/result?status=${responseCode === "00" ? "success" : "failed"}&ref=${txnRef}`);
}

export async function vnpayIPNController(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const isValid = verifyVNPaySignature(request.query as Record<string, string>);
  if (!isValid) {
    reply.send({ RspCode: "97", Message: "Invalid signature" });
    return;
  }

  const isSuccess = request.query.vnp_ResponseCode === "00";
  await paymentsService.handleIPN(request.query.vnp_TxnRef, request.query, isSuccess);
  reply.send({ RspCode: "00", Message: "Confirm Success" });
}

export async function momoCallbackController(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const resultCode = request.query.resultCode;
  const orderId = request.query.orderId;
  reply.redirect(`${process.env.WEB_URL || "http://localhost:3000"}/payment/result?status=${resultCode === "0" ? "success" : "failed"}&ref=${orderId}`);
}

export async function momoIPNController(
  request: FastifyRequest<{ Body: Record<string, any> }>,
  reply: FastifyReply
) {
  const isValid = verifyMoMoSignature(request.body);
  if (!isValid) {
    reply.status(400).send({ message: "Invalid signature" });
    return;
  }

  const isSuccess = request.body.resultCode === 0;
  await paymentsService.handleIPN(request.body.orderId, request.body, isSuccess);
  reply.status(204).send();
}

export async function paymentHistoryController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await paymentsService.getHistory(id, page, limit);
    reply.send(success(result.payments, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function paymentDetailController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const payment = await paymentsService.getById(request.params.id, userId);
    reply.send(success(payment));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
