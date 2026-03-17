import { prisma } from "../../lib/prisma";
import { SendMessageInput } from "@bcare/shared";

async function getDoctorIdByUserId(userId: string): Promise<string | null> {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
  return doctor?.id || null;
}

async function hasAppointmentTogether(patientId: string, doctorId: string): Promise<boolean> {
  const count = await prisma.appointment.count({
    where: { patientId, doctorId, status: { not: "CANCELLED" } },
  });
  return count > 0;
}

export class ChatService {
  async createOrGetConversation(userId: string, userRole: string, targetDoctorId?: string, targetPatientId?: string) {
    let patientId: string;
    let doctorId: string;

    if (userRole === "PATIENT") {
      if (!targetDoctorId) throw { code: "BAD_REQUEST", message: "doctorId là bắt buộc", status: 400 };
      patientId = userId;
      doctorId = targetDoctorId;
    } else if (userRole === "DOCTOR") {
      if (!targetPatientId) throw { code: "BAD_REQUEST", message: "patientId là bắt buộc", status: 400 };
      const myDoctorId = await getDoctorIdByUserId(userId);
      if (!myDoctorId) throw { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ bác sĩ", status: 404 };
      patientId = targetPatientId;
      doctorId = myDoctorId;
    } else {
      throw { code: "FORBIDDEN", message: "Không có quyền tạo cuộc trò chuyện", status: 403 };
    }

    // Verify they have an appointment together
    const hasAccess = await hasAppointmentTogether(patientId, doctorId);
    if (!hasAccess) throw { code: "FORBIDDEN", message: "Cần có lịch hẹn để bắt đầu trò chuyện", status: 403 };

    // Find or create
    const existing = await prisma.conversation.findUnique({
      where: { patientId_doctorId: { patientId, doctorId } },
      include: {
        doctor: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
        patient: { select: { fullName: true, avatarUrl: true } },
      },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: { patientId, doctorId },
      include: {
        doctor: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
        patient: { select: { fullName: true, avatarUrl: true } },
      },
    });
  }

  async listConversations(userId: string, userRole: string) {
    let where: any;

    if (userRole === "PATIENT") {
      where = { patientId: userId };
    } else if (userRole === "DOCTOR") {
      const doctorId = await getDoctorIdByUserId(userId);
      if (!doctorId) return [];
      where = { doctorId };
    } else {
      return [];
    }

    return prisma.conversation.findMany({
      where,
      include: {
        doctor: { include: { user: { select: { fullName: true, avatarUrl: true } }, specialty: { select: { name: true } } } },
        patient: { select: { id: true, fullName: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getMessages(userId: string, userRole: string, conversationId: string, page = 1, limit = 50) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw { code: "NOT_FOUND", message: "Cuộc trò chuyện không tồn tại", status: 404 };

    // Access check
    if (userRole === "PATIENT" && conv.patientId !== userId) {
      throw { code: "FORBIDDEN", message: "Không có quyền xem tin nhắn", status: 403 };
    }
    if (userRole === "DOCTOR") {
      const doctorId = await getDoctorIdByUserId(userId);
      if (conv.doctorId !== doctorId) throw { code: "FORBIDDEN", message: "Không có quyền xem tin nhắn", status: 403 };
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return { messages, total, page, limit };
  }

  async sendMessage(userId: string, userRole: string, conversationId: string, input: SendMessageInput) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw { code: "NOT_FOUND", message: "Cuộc trò chuyện không tồn tại", status: 404 };

    // Access check
    if (userRole === "PATIENT" && conv.patientId !== userId) {
      throw { code: "FORBIDDEN", message: "Không có quyền gửi tin nhắn", status: 403 };
    }
    if (userRole === "DOCTOR") {
      const doctorId = await getDoctorIdByUserId(userId);
      if (conv.doctorId !== doctorId) throw { code: "FORBIDDEN", message: "Không có quyền gửi tin nhắn", status: 403 };
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: input.content,
        type: input.type as any,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
      },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    // Update conversation timestamp
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    return { message, conversation: conv };
  }
}

export const chatService = new ChatService();
