import { FastifyRequest, FastifyReply } from "fastify";
import { medicalRecordsService } from "./medical-records.service";
import { success } from "../../lib/response";
import { CreateMedicalNoteInput, UpdateMedicalNoteInput, UpdatePatientProfileInput } from "@bcare/shared";

// --- Patient Profile ---

export async function getMyProfileController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    const profile = await medicalRecordsService.getMyProfile(id, request.ip);
    reply.send(success(profile));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updateMyProfileController(
  request: FastifyRequest<{ Body: UpdatePatientProfileInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const profile = await medicalRecordsService.updateMyProfile(id, request.body, request.ip);
    reply.send(success(profile));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getPatientProfileController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const profile = await medicalRecordsService.getPatientProfile(userId, request.params.id, request.ip);
    reply.send(success(profile));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

// --- Medical Notes ---

export async function createNoteController(
  request: FastifyRequest<{ Body: CreateMedicalNoteInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const note = await medicalRecordsService.createNote(id, request.body, request.ip);
    reply.status(201).send(success(note));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updateNoteController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalNoteInput }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const note = await medicalRecordsService.updateNote(userId, request.params.id, request.body, request.ip);
    reply.send(success(note));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getNoteByAppointmentController(
  request: FastifyRequest<{ Params: { appointmentId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id, role } = request.user as { id: string; role: string };
    const note = await medicalRecordsService.getNoteByAppointment(id, role, request.params.appointmentId, request.ip);
    reply.send(success(note));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getPatientNotesController(
  request: FastifyRequest<{ Params: { patientId: string }; Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await medicalRecordsService.getPatientNotes(id, request.params.patientId, page, limit, request.ip);
    reply.send(success(result.notes, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function getMyNotesController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await medicalRecordsService.getMyNotes(id, page, limit, request.ip);
    reply.send(success(result.notes, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

// --- Attachments ---

export async function uploadAttachmentController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    // For now, accept JSON body with file metadata (Supabase Storage upload happens on frontend)
    const body = request.body as { fileName: string; fileUrl: string; fileType: string; fileSize: number };
    const attachment = await medicalRecordsService.addAttachment(userId, request.params.id, body, request.ip);
    reply.status(201).send(success(attachment));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}

export async function deleteAttachmentController(
  request: FastifyRequest<{ Params: { id: string; attachmentId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const result = await medicalRecordsService.deleteAttachment(userId, request.params.id, request.params.attachmentId, request.ip);
    reply.send(success(result));
  } catch (err: any) {
    reply.status(err.status || 500).send({ success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } });
  }
}
