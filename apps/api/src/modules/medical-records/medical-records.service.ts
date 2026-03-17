import { prisma } from "../../lib/prisma";
import { logAudit } from "../../lib/audit";
import { CreateMedicalNoteInput, UpdateMedicalNoteInput, UpdatePatientProfileInput } from "@bcare/shared";

async function getDoctorByUserId(userId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ bác sĩ", status: 404 };
  return doctor;
}

async function hasAppointmentWithPatient(doctorId: string, patientId: string): Promise<boolean> {
  const count = await prisma.appointment.count({
    where: { doctorId, patientId, status: { not: "CANCELLED" } },
  });
  return count > 0;
}

export class MedicalRecordsService {
  // --- Patient Profile ---

  async getMyProfile(patientId: string, ipAddress?: string) {
    await logAudit({ userId: patientId, action: "VIEW_PATIENT_PROFILE", resourceType: "PatientProfile", resourceId: patientId, ipAddress });

    const profile = await prisma.patientProfile.findUnique({ where: { patientId } });
    if (!profile) {
      // Auto-create empty profile
      return prisma.patientProfile.create({ data: { patientId } });
    }
    return profile;
  }

  async updateMyProfile(patientId: string, input: UpdatePatientProfileInput, ipAddress?: string) {
    await logAudit({ userId: patientId, action: "UPDATE_PATIENT_PROFILE", resourceType: "PatientProfile", resourceId: patientId, ipAddress });

    return prisma.patientProfile.upsert({
      where: { patientId },
      update: input,
      create: { patientId, ...input },
    });
  }

  async getPatientProfile(userId: string, patientId: string, ipAddress?: string) {
    const doctor = await getDoctorByUserId(userId);
    const hasAccess = await hasAppointmentWithPatient(doctor.id, patientId);
    if (!hasAccess) throw { code: "FORBIDDEN", message: "Bạn chưa có lịch hẹn với bệnh nhân này", status: 403 };

    await logAudit({ userId, action: "VIEW_PATIENT_PROFILE", resourceType: "PatientProfile", resourceId: patientId, ipAddress });

    const profile = await prisma.patientProfile.findUnique({ where: { patientId } });
    if (!profile) return { patientId, bloodType: null, allergies: [], conditions: [], medications: [], notes: null };
    return profile;
  }

  // --- Medical Notes ---

  async createNote(userId: string, input: CreateMedicalNoteInput, ipAddress?: string) {
    const doctor = await getDoctorByUserId(userId);

    const appointment = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
      select: { id: true, patientId: true, doctorId: true, status: true },
    });

    if (!appointment) throw { code: "NOT_FOUND", message: "Lịch hẹn không tồn tại", status: 404 };
    if (appointment.doctorId !== doctor.id) throw { code: "FORBIDDEN", message: "Không có quyền tạo ghi chú cho lịch hẹn này", status: 403 };
    if (!["COMPLETED", "IN_PROGRESS"].includes(appointment.status)) {
      throw { code: "BAD_REQUEST", message: "Chỉ có thể tạo ghi chú khi lịch hẹn đang khám hoặc đã hoàn thành", status: 400 };
    }

    const existing = await prisma.medicalNote.findUnique({ where: { appointmentId: input.appointmentId } });
    if (existing) throw { code: "DUPLICATE", message: "Lịch hẹn này đã có ghi chú", status: 409 };

    const note = await prisma.medicalNote.create({
      data: {
        appointmentId: input.appointmentId,
        doctorId: doctor.id,
        patientId: appointment.patientId,
        diagnosis: input.diagnosis,
        prescription: input.prescription,
        notes: input.notes,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
      },
      include: { attachments: true },
    });

    await logAudit({ userId, action: "CREATE_MEDICAL_NOTE", resourceType: "MedicalNote", resourceId: note.id, ipAddress });

    return note;
  }

  async updateNote(userId: string, noteId: string, input: UpdateMedicalNoteInput, ipAddress?: string) {
    const doctor = await getDoctorByUserId(userId);

    const note = await prisma.medicalNote.findUnique({ where: { id: noteId } });
    if (!note) throw { code: "NOT_FOUND", message: "Ghi chú không tồn tại", status: 404 };
    if (note.doctorId !== doctor.id) throw { code: "FORBIDDEN", message: "Không có quyền sửa ghi chú này", status: 403 };

    const updated = await prisma.medicalNote.update({
      where: { id: noteId },
      data: {
        ...(input.diagnosis !== undefined && { diagnosis: input.diagnosis }),
        ...(input.prescription !== undefined && { prescription: input.prescription }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.followUpDate !== undefined && { followUpDate: input.followUpDate ? new Date(input.followUpDate) : null }),
      },
      include: { attachments: true },
    });

    await logAudit({ userId, action: "UPDATE_MEDICAL_NOTE", resourceType: "MedicalNote", resourceId: noteId, ipAddress });

    return updated;
  }

  async getNoteByAppointment(userId: string, userRole: string, appointmentId: string, ipAddress?: string) {
    const note = await prisma.medicalNote.findUnique({
      where: { appointmentId },
      include: {
        attachments: true,
        doctor: { include: { user: { select: { fullName: true, avatarUrl: true } }, specialty: { select: { name: true } } } },
      },
    });

    if (!note) throw { code: "NOT_FOUND", message: "Chưa có ghi chú cho lịch hẹn này", status: 404 };

    // Access check
    if (userRole === "PATIENT" && note.patientId !== userId) {
      throw { code: "FORBIDDEN", message: "Không có quyền xem ghi chú này", status: 403 };
    }
    if (userRole === "DOCTOR") {
      const doctor = await getDoctorByUserId(userId);
      if (note.doctorId !== doctor.id) {
        const hasAccess = await hasAppointmentWithPatient(doctor.id, note.patientId);
        if (!hasAccess) throw { code: "FORBIDDEN", message: "Không có quyền xem ghi chú này", status: 403 };
      }
    }

    await logAudit({ userId, action: "VIEW_MEDICAL_RECORD", resourceType: "MedicalNote", resourceId: note.id, ipAddress });

    return note;
  }

  async getPatientNotes(userId: string, patientId: string, page = 1, limit = 20, ipAddress?: string) {
    const doctor = await getDoctorByUserId(userId);
    const hasAccess = await hasAppointmentWithPatient(doctor.id, patientId);
    if (!hasAccess) throw { code: "FORBIDDEN", message: "Bạn chưa có lịch hẹn với bệnh nhân này", status: 403 };

    await logAudit({ userId, action: "VIEW_MEDICAL_RECORD", resourceType: "MedicalNote", resourceId: patientId, ipAddress });

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      prisma.medicalNote.findMany({
        where: { patientId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attachments: true,
          doctor: { include: { user: { select: { fullName: true } }, specialty: { select: { name: true } } } },
          appointment: { select: { date: true, timeSlot: true } },
        },
      }),
      prisma.medicalNote.count({ where: { patientId } }),
    ]);

    return { notes, total, page, limit };
  }

  async getMyNotes(patientId: string, page = 1, limit = 20, ipAddress?: string) {
    await logAudit({ userId: patientId, action: "VIEW_MEDICAL_RECORD", resourceType: "MedicalNote", resourceId: patientId, ipAddress });

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      prisma.medicalNote.findMany({
        where: { patientId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attachments: true,
          doctor: { include: { user: { select: { fullName: true, avatarUrl: true } }, specialty: { select: { name: true } } } },
          appointment: { select: { date: true, timeSlot: true } },
        },
      }),
      prisma.medicalNote.count({ where: { patientId } }),
    ]);

    return { notes, total, page, limit };
  }

  // --- Attachments ---

  async addAttachment(userId: string, noteId: string, file: { fileName: string; fileUrl: string; fileType: string; fileSize: number }, ipAddress?: string) {
    const doctor = await getDoctorByUserId(userId);

    const note = await prisma.medicalNote.findUnique({ where: { id: noteId }, include: { attachments: true } });
    if (!note) throw { code: "NOT_FOUND", message: "Ghi chú không tồn tại", status: 404 };
    if (note.doctorId !== doctor.id) throw { code: "FORBIDDEN", message: "Không có quyền thêm file", status: 403 };
    if (note.attachments.length >= 5) throw { code: "LIMIT_EXCEEDED", message: "Tối đa 5 file đính kèm", status: 400 };

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
    if (!ALLOWED_TYPES.includes(file.fileType)) {
      throw { code: "INVALID_FILE_TYPE", message: "Chỉ chấp nhận JPEG, PNG hoặc PDF", status: 400 };
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.fileSize > MAX_SIZE) {
      throw { code: "FILE_TOO_LARGE", message: "File tối đa 10MB", status: 400 };
    }

    const attachment = await prisma.medicalAttachment.create({
      data: { noteId, fileName: file.fileName, fileUrl: file.fileUrl, fileType: file.fileType, fileSize: file.fileSize },
    });

    await logAudit({ userId, action: "UPLOAD_ATTACHMENT", resourceType: "MedicalAttachment", resourceId: attachment.id, ipAddress });

    return attachment;
  }

  async deleteAttachment(userId: string, noteId: string, attachmentId: string, ipAddress?: string) {
    const doctor = await getDoctorByUserId(userId);

    const note = await prisma.medicalNote.findUnique({ where: { id: noteId } });
    if (!note) throw { code: "NOT_FOUND", message: "Ghi chú không tồn tại", status: 404 };
    if (note.doctorId !== doctor.id) throw { code: "FORBIDDEN", message: "Không có quyền xóa file", status: 403 };

    const attachment = await prisma.medicalAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.noteId !== noteId) throw { code: "NOT_FOUND", message: "File không tồn tại", status: 404 };

    await prisma.medicalAttachment.delete({ where: { id: attachmentId } });

    await logAudit({ userId, action: "DELETE_ATTACHMENT", resourceType: "MedicalAttachment", resourceId: attachmentId, ipAddress });

    return { success: true };
  }
}

export const medicalRecordsService = new MedicalRecordsService();
