import { prisma } from "../../lib/prisma";
import { CreateAppointmentInput, UpdateAppointmentInput, ListAppointmentsInput } from "@bcare/shared";

export class AppointmentsService {
  async create(patientId: string, input: CreateAppointmentInput) {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.$queryRaw<any[]>`
        SELECT id FROM appointments
        WHERE doctor_id = ${input.doctorId}
          AND date = ${new Date(input.date)}::date
          AND time_slot = ${input.timeSlot}
          AND status != 'CANCELLED'
        FOR UPDATE
      `;
      if (existing.length > 0) throw { code: "SLOT_TAKEN", message: "Khung giờ này đã được đặt", status: 409 };

      const doctor = await tx.doctor.findUnique({ where: { id: input.doctorId } });
      if (!doctor) throw { code: "DOCTOR_NOT_FOUND", message: "Bác sĩ không tồn tại", status: 404 };

      return tx.appointment.create({
        data: {
          patientId,
          doctorId: input.doctorId,
          clinicId: doctor.clinicId,
          scheduleId: input.scheduleId,
          date: new Date(input.date),
          timeSlot: input.timeSlot,
          symptomNote: input.symptomNote,
          paymentMethod: input.paymentMethod as any,
          amount: doctor.consultationFee,
        },
        include: {
          doctor: { include: { user: { select: { fullName: true } }, specialty: true } },
          clinic: { select: { name: true, address: true } },
        },
      });
    });
  }

  async findAll(where: any, input: ListAppointmentsInput) {
    const { page, limit, status, dateFrom, dateTo } = input;
    const skip = (page - 1) * limit;

    if (status) where.status = status;
    if (dateFrom) where.date = { ...where.date, gte: new Date(dateFrom) };
    if (dateTo) where.date = { ...where.date, lte: new Date(dateTo) };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          doctor: { include: { user: { select: { fullName: true, avatarUrl: true } }, specialty: { select: { name: true } } } },
          patient: { select: { fullName: true, avatarUrl: true, phone: true } },
          clinic: { select: { name: true, address: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total, page, limit };
  }

  async findById(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: { select: { fullName: true, avatarUrl: true, phone: true } }, specialty: true } },
        patient: { select: { id: true, fullName: true, avatarUrl: true, phone: true, email: true } },
        clinic: { select: { name: true, address: true, city: true, phone: true } },
        schedule: true,
      },
    });
    if (!appointment) throw { code: "NOT_FOUND", message: "Lịch hẹn không tồn tại", status: 404 };
    return appointment;
  }

  async updateStatus(id: string, status: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status: status as any },
      include: {
        doctor: { include: { user: { select: { fullName: true } } } },
        patient: { select: { fullName: true } },
      },
    });
  }
}

export const appointmentsService = new AppointmentsService();
