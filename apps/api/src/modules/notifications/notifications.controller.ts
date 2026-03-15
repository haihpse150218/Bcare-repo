import { FastifyRequest, FastifyReply } from "fastify";
import { notificationsService } from "./notifications.service";
import { success } from "../../lib/response";

export async function listNotificationsController(request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) {
  try {
    const { id: userId } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await notificationsService.findAll(userId, page, limit);
    const unreadCount = await notificationsService.getUnreadCount(userId);
    reply.send(success({ ...result, unreadCount }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function markAsReadController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id: userId } = request.user as { id: string };
    await notificationsService.markAsRead(request.params.id, userId);
    reply.send(success({ message: "Đã đánh dấu đã đọc" }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function markAllAsReadController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id: userId } = request.user as { id: string };
    await notificationsService.markAllAsRead(userId);
    reply.send(success({ message: "Đã đánh dấu tất cả đã đọc" }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
