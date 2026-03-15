import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { success } from "../../lib/response";

export async function createScheduleController(
  request: FastifyRequest<{ Body: { dayOfWeek: number; startTime: string; endTime: string; slotDuration?: number } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Doctor profile not found" } });

    const schedule = await prisma.schedule.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: request.body.dayOfWeek,
        startTime: request.body.startTime,
        endTime: request.body.endTime,
        slotDuration: request.body.slotDuration || 30,
      },
    });
    reply.status(201).send(success(schedule));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function updateScheduleController(
  request: FastifyRequest<{ Params: { id: string }; Body: { startTime?: string; endTime?: string; slotDuration?: number; isActive?: boolean } }>,
  reply: FastifyReply
) {
  try {
    const schedule = await prisma.schedule.update({
      where: { id: request.params.id },
      data: request.body,
    });
    reply.send(success(schedule));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function deleteScheduleController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await prisma.schedule.delete({ where: { id: request.params.id } });
    reply.send(success({ message: "Đã xóa lịch" }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function listMySchedulesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Doctor profile not found" } });

    const schedules = await prisma.schedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { dayOfWeek: "asc" },
    });
    reply.send(success(schedules));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
