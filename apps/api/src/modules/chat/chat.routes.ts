import { FastifyInstance } from "fastify";
import {
  createConversationController,
  listConversationsController,
  getMessagesController,
  sendMessageController,
} from "./chat.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, sendMessageSchema, SendMessageInput } from "@bcare/shared";

export async function chatRoutes(app: FastifyInstance) {
  app.post<{ Body: { doctorId?: string; patientId?: string } }>("/api/conversations", {
    preHandler: [authenticate, authorize(Role.PATIENT, Role.DOCTOR)],
  }, createConversationController);

  app.get("/api/conversations", {
    preHandler: [authenticate, authorize(Role.PATIENT, Role.DOCTOR)],
  }, listConversationsController);

  app.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>("/api/conversations/:id/messages", {
    preHandler: [authenticate, authorize(Role.PATIENT, Role.DOCTOR)],
  }, getMessagesController);

  app.post<{ Params: { id: string }; Body: SendMessageInput }>("/api/conversations/:id/messages", {
    preHandler: [authenticate, authorize(Role.PATIENT, Role.DOCTOR), validate(sendMessageSchema)],
  }, sendMessageController);
}
