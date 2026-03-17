import { FastifyRequest, FastifyReply } from "fastify";
import { chatService } from "./chat.service";
import { success } from "../../lib/response";
import { SendMessageInput } from "@bcare/shared";

export async function createConversationController(
  request: FastifyRequest<{ Body: { doctorId?: string; patientId?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id, role } = request.user as { id: string; role: string };
    const conv = await chatService.createOrGetConversation(id, role, request.body.doctorId, request.body.patientId);
    reply.status(201).send(success(conv));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function listConversationsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, role } = request.user as { id: string; role: string };
    const conversations = await chatService.listConversations(id, role);
    reply.send(success(conversations));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getMessagesController(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId, role } = request.user as { id: string; role: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "50");
    const result = await chatService.getMessages(userId, role, request.params.id, page, limit);
    reply.send(success(result.messages, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function sendMessageController(
  request: FastifyRequest<{ Params: { id: string }; Body: SendMessageInput }>,
  reply: FastifyReply
) {
  try {
    const { id: userId, role } = request.user as { id: string; role: string };
    const { message } = await chatService.sendMessage(userId, role, request.params.id, request.body);
    reply.status(201).send(success(message));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}
