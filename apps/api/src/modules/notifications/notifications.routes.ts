import { FastifyInstance } from "fastify";
import { listNotificationsController, markAsReadController, markAllAsReadController } from "./notifications.controller";
import { getPreferencesController, updatePreferencesController } from "./preferences.controller";
import { authenticate } from "../../middleware/authenticate";

export async function notificationsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: string; limit?: string } }>("/api/notifications", { preHandler: [authenticate] }, listNotificationsController);
  app.get("/api/notifications/preferences", { preHandler: [authenticate] }, getPreferencesController);
  app.put<{ Body: { email?: boolean; sms?: boolean; inApp?: boolean } }>("/api/notifications/preferences", { preHandler: [authenticate] }, updatePreferencesController);
  app.patch<{ Params: { id: string } }>("/api/notifications/:id/read", { preHandler: [authenticate] }, markAsReadController);
  app.patch("/api/notifications/read-all", { preHandler: [authenticate] }, markAllAsReadController);
}
