import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { success } from "../../lib/response";

export async function getPreferencesController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    let prefs = await prisma.notificationPreference.findUnique({ where: { userId: id } });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: id },
      });
    }
    reply.send(success(prefs));
  } catch (err: any) {
    reply.status(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updatePreferencesController(
  request: FastifyRequest<{ Body: { email?: boolean; sms?: boolean; inApp?: boolean } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: id },
      update: request.body,
      create: { userId: id, ...request.body },
    });
    reply.send(success(prefs));
  } catch (err: any) {
    reply.status(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
}
