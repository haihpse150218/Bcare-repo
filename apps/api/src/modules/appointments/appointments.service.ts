import { prisma } from "../../lib/prisma";
import { CreateAppointmentInput, UpdateAppointmentInput, ListAppointmentsInput } from "@bcare/shared";
import { notify, scheduleReminder, cancelReminders } from "../../lib/notify";

// Parse "YYYY-MM-DD" as local date to avoid timezone shift
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export class AppointmentsService {
  async create(patientId: string, input: CreateAppointmentInput) {
    const created = await prisma.$transaction(async (tx: any) => {
      const dateObj = parseLocalDate(input.date);
      const existing = await tx.$queryRaw<any[]>`
        SELECT id FROM appointments
        WHERE doctor_id = ${input.doctorId}
          AND date = ${dateObj}::date
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
          date: dateObj,
          timeSlot: input.timeSlot,
          symptomNote: input.symptomNote,
          paymentMethod: input.paymentMethod as any,
          amount: doctor.consultationFee,
        },
        include: {
          doctor: { include: { user: { select: { id: true, fullName: true } }, specialty: true } },
          clinic: { select: { name: true, address: true } },
        },
      });
    });

    // Notify doctor about new appointment
    await notify({
      userId: created.doctor.user.id,
      type: "APPOINTMENT_CREATED",
      title: "Lịch hẹn mới",
      content: `Bệnh nhân đặt lịch hẹn ngày ${input.date} lúc ${input.timeSlot}`,
      channels: ["IN_APP", "EMAIL"],
    });

    // Notify patient
    await notify({
      userId: patientId,
      type: "APPOINTMENT_CREATED",
      title: "Đặt lịch thành công",
      content: `Lịch hẹn với ${created.doctor.user.fullName} ngày ${input.date} lúc ${input.timeSlot}`,
      channels: ["IN_APP", "EMAIL"],
    });

    return created;
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

  async updateStatus(id: string, status: string, cancelledByRole?: string) {
    const result = await prisma.appointment.update({
      where: { id },
      data: { status: status as any },
      include: {
        doctor: { include: { user: { select: { id: true, fullName: true } } } },
        patient: { select: { id: true, fullName: true } },
      },
    });

    // Process refund on cancellation
    if (status === "CANCELLED") {
      const cancelledBy = (cancelledByRole === "DOCTOR" || cancelledByRole === "STAFF") ? "DOCTOR" : "PATIENT";
      const { paymentsService } = await import("../payments/payments.service");
      await paymentsService.processRefund(id, cancelledBy as "PATIENT" | "DOCTOR");
      await cancelReminders(id);
    }

    if (status === "CONFIRMED") {
      // Schedule reminders
      const appointmentDate = new Date(result.date);
      const [h, m] = result.timeSlot.split(":").map(Number);
      appointmentDate.setHours(h, m, 0, 0);

      await scheduleReminder(
        id,
        result.patientId,
        result.doctor.user.fullName,
        result.date.toISOString().split("T")[0],
        result.timeSlot,
        appointmentDate
      );

      await notify({
        userId: result.patientId,
        type: "APPOINTMENT_CONFIRMED",
        title: "Lịch hẹn đã xác nhận",
        content: `Lịch hẹn với ${result.doctor.user.fullName} đã được xác nhận`,
        channels: ["IN_APP", "EMAIL", "SMS"],
      });
    }

    if (status === "CANCELLED") {
      await notify({
        userId: result.patientId,
        type: "APPOINTMENT_CANCELLED",
        title: "Lịch hẹn đã hủy",
        content: `Lịch hẹn đã bị hủy`,
        channels: ["IN_APP", "EMAIL"],
      });
    }

    return result;
  }
}

export const appointmentsService = new AppointmentsService();
