import { FastifyInstance } from "fastify";
import {
  getMyProfileController,
  updateMyProfileController,
  getPatientProfileController,
  createNoteController,
  updateNoteController,
  getNoteByAppointmentController,
  getPatientNotesController,
  getMyNotesController,
  uploadAttachmentController,
  deleteAttachmentController,
} from "./medical-records.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  Role,
  createMedicalNoteSchema,
  updateMedicalNoteSchema,
  updatePatientProfileSchema,
  CreateMedicalNoteInput,
  UpdateMedicalNoteInput,
  UpdatePatientProfileInput,
} from "@bcare/shared";

export async function medicalRecordsRoutes(app: FastifyInstance) {
  // Patient Profile
  app.get("/api/patients/my-profile", {
    preHandler: [authenticate, authorize(Role.PATIENT)],
  }, getMyProfileController);

  app.put<{ Body: UpdatePatientProfileInput }>("/api/patients/my-profile", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(updatePatientProfileSchema)],
  }, updateMyProfileController);

  app.get<{ Params: { id: string } }>("/api/patients/:id/profile", {
    preHandler: [authenticate, authorize(Role.DOCTOR, Role.STAFF)],
  }, getPatientProfileController);

  // Medical Notes
  app.post<{ Body: CreateMedicalNoteInput }>("/api/medical-notes", {
    preHandler: [authenticate, authorize(Role.DOCTOR), validate(createMedicalNoteSchema)],
  }, createNoteController);

  app.put<{ Params: { id: string }; Body: UpdateMedicalNoteInput }>("/api/medical-notes/:id", {
    preHandler: [authenticate, authorize(Role.DOCTOR), validate(updateMedicalNoteSchema)],
  }, updateNoteController);

  app.get<{ Params: { appointmentId: string } }>("/api/medical-notes/appointment/:appointmentId", {
    preHandler: [authenticate, authorize(Role.DOCTOR, Role.PATIENT)],
  }, getNoteByAppointmentController);

  app.get<{ Params: { patientId: string }; Querystring: { page?: string; limit?: string } }>("/api/medical-notes/patient/:patientId", {
    preHandler: [authenticate, authorize(Role.DOCTOR, Role.STAFF)],
  }, getPatientNotesController);

  app.get<{ Querystring: { page?: string; limit?: string } }>("/api/my-medical-notes", {
    preHandler: [authenticate, authorize(Role.PATIENT)],
  }, getMyNotesController);

  // Attachments
  app.post<{ Params: { id: string } }>("/api/medical-notes/:id/attachments", {
    preHandler: [authenticate, authorize(Role.DOCTOR)],
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, uploadAttachmentController);

  app.delete<{ Params: { id: string; attachmentId: string } }>("/api/medical-notes/:id/attachments/:attachmentId", {
    preHandler: [authenticate, authorize(Role.DOCTOR)],
  }, deleteAttachmentController);
}
