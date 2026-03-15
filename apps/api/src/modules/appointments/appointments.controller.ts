import { FastifyRequest, FastifyReply } from "fastify";
import { appointmentsService } from "./appointments.service";
import { CreateAppointmentInput, UpdateAppointmentInput, ListAppointmentsInput } from "@bcare/shared";
import { listAppointmentsSchema } from "@bcare/shared";
import { success } from "../../lib/response";
import { prisma } from "../../lib/prisma";

export async function createAppointmentController(
  request: FastifyRequest<{ Body: CreateAppointmentInput }>,
  reply: FastifyReply
) {
  try {
    const { id: patientId } = request.user as { id: string };
    const appointment = await appointmentsService.create(patientId, request.body);
    reply.status(201).send(success(appointment));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function listAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id: userId, role } = request.user as { id: string; role: string };
    const input = listAppointmentsSchema.parse(request.query);
    const where: any = {};

    if (role === "PATIENT") {
      where.patientId = userId;
    } else if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (doctor) where.doctorId = doctor.id;
    } else if (role === "STAFF") {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (staff) where.clinicId = staff.clinicId;
    } else if (role === "ADMIN") {
      // Admin sees all
    }

    const result = await appointmentsService.findAll(where, input);
    reply.send(success(result.appointments, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function getAppointmentController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const appointment = await appointmentsService.findById(request.params.id);
    reply.send(success(appointment));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function updateAppointmentController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateAppointmentInput }>,
  reply: FastifyReply
) {
  try {
    const appointment = await appointmentsService.updateStatus(request.params.id, request.body.status);
    reply.send(success(appointment));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
