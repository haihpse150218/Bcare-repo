import { FastifyInstance } from "fastify";
import { listNotificationsController, markAsReadController, markAllAsReadController } from "./notifications.controller";
import { authenticate } from "../../middleware/authenticate";

export async function notificationsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: string; limit?: string } }>("/api/notifications", { preHandler: [authenticate] }, listNotificationsController);
  app.patch<{ Params: { id: string } }>("/api/notifications/:id/read", { preHandler: [authenticate] }, markAsReadController);
  app.patch("/api/notifications/read-all", { preHandler: [authenticate] }, markAllAsReadController);
}
