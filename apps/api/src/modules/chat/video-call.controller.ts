import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { success } from "../../lib/response";

export async function generateVideoTokenController(
  request: FastifyRequest<{ Body: { conversationId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId, role } = request.user as { id: string; role: string };
    const { conversationId } = request.body;

    // Verify conversation exists and user is participant
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw { code: "NOT_FOUND", message: "Cuộc trò chuyện không tồn tại", status: 404 };

    if (role === "PATIENT" && conv.patientId !== userId) {
      throw { code: "FORBIDDEN", message: "Không có quyền", status: 403 };
    }
    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (!doctor || conv.doctorId !== doctor.id) {
        throw { code: "FORBIDDEN", message: "Không có quyền", status: 403 };
      }
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      // Return mock token for development
      reply.send(success({
        token: "mock-agora-token-dev",
        channel: conversationId,
        uid: userId,
        appId: appId || "mock-app-id",
      }));
      return;
    }

    // In production, use agora-token package to generate RTC token
    // const { RtcTokenBuilder, RtcRole } = require("agora-token");
    // const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, conversationId, 0, RtcRole.PUBLISHER, Math.floor(Date.now() / 1000) + 3600);

    reply.send(success({
      token: "agora-token-placeholder",
      channel: conversationId,
      uid: userId,
      appId,
    }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}
