import { FastifyRequest, FastifyReply } from "fastify";
import { slotsService } from "./slots.service";
import { success } from "../../lib/response";

export async function getSlotsController(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { date: string } }>,
  reply: FastifyReply
) {
  try {
    if (!request.query.date) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Vui lòng chọn ngày" },
      });
    }
    const slots = await slotsService.getAvailableSlots(request.params.id, request.query.date);
    reply.send(success(slots));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
