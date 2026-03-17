import { prisma } from "../../lib/prisma";
import { UpdateClinicProfileInput, AddDoctorToClinicInput, AddStaffToClinicInput } from "@bcare/shared";

async function getClinicByUserId(userId: string) {
  const clinic = await prisma.clinic.findUnique({ where: { userId } });
  if (!clinic) throw { code: "CLINIC_NOT_FOUND", message: "Không tìm thấy phòng khám", status: 404 };
  return clinic;
}

async function getStaffClinicId(userId: string): Promise<string> {
  const staff = await prisma.staff.findUnique({ where: { userId } });
  if (!staff) throw { code: "NOT_FOUND", message: "Không tìm thấy nhân viên", status: 404 };
  return staff.clinicId;
}

export class ClinicManagementService {
  // --- Clinic Info ---

  async getMyClinic(userId: string) {
    return getClinicByUserId(userId);
  }

  async updateMyClinic(userId: string, input: UpdateClinicProfileInput) {
    const clinic = await getClinicByUserId(userId);
    return prisma.clinic.update({ where: { id: clinic.id }, data: input });
  }

  // --- Doctors ---

  async listDoctors(userId: string, userRole: string) {
    let clinicId: string;
    if (userRole === "STAFF") {
      clinicId = await getStaffClinicId(userId);
    } else {
      const clinic = await getClinicByUserId(userId);
      clinicId = clinic.id;
    }

    return prisma.doctor.findMany({
      where: { clinicId },
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } },
        specialty: { select: { name: true } },
      },
    });
  }

  async addDoctor(userId: string, input: AddDoctorToClinicInput) {
    const clinic = await getClinicByUserId(userId);

    const user = await prisma.user.findUnique({ where: { email: input.email }, include: { doctor: true } });
    if (!user) throw { code: "NOT_FOUND", message: "Không tìm thấy người dùng với email này", status: 404 };
    if (user.role !== "DOCTOR") throw { code: "BAD_REQUEST", message: "Người dùng không phải là bác sĩ", status: 400 };
    if (!user.doctor) throw { code: "BAD_REQUEST", message: "Người dùng chưa có hồ sơ bác sĩ", status: 400 };
    if (user.doctor.clinicId && user.doctor.clinicId !== clinic.id) {
      throw { code: "CONFLICT", message: "Bác sĩ đã thuộc phòng khám khác", status: 409 };
    }
    if (user.doctor.clinicId === clinic.id) {
      throw { code: "DUPLICATE", message: "Bác sĩ đã thuộc phòng khám này", status: 409 };
    }

    return prisma.doctor.update({
      where: { id: user.doctor.id },
      data: { clinicId: clinic.id },
      include: { user: { select: { fullName: true, email: true } }, specialty: { select: { name: true } } },
    });
  }

  async removeDoctor(userId: string, doctorId: string) {
    const clinic = await getClinicByUserId(userId);

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.clinicId !== clinic.id) {
      throw { code: "NOT_FOUND", message: "Bác sĩ không thuộc phòng khám này", status: 404 };
    }

    return prisma.doctor.update({
      where: { id: doctorId },
      data: { clinicId: null },
    });
  }

  // --- Staff ---

  async listStaff(userId: string) {
    const clinic = await getClinicByUserId(userId);
    return prisma.staff.findMany({
      where: { clinicId: clinic.id },
      include: { user: { select: { fullName: true, email: true, avatarUrl: true } } },
    });
  }

  async addStaff(userId: string, input: AddStaffToClinicInput) {
    const clinic = await getClinicByUserId(userId);

    const user = await prisma.user.findUnique({ where: { email: input.email }, include: { staff: true } });
    if (!user) throw { code: "NOT_FOUND", message: "Không tìm thấy người dùng với email này", status: 404 };
    if (user.role !== "STAFF") throw { code: "BAD_REQUEST", message: "Người dùng không có vai trò nhân viên", status: 400 };
    if (user.staff) throw { code: "DUPLICATE", message: "Nhân viên đã thuộc một phòng khám", status: 409 };

    return prisma.staff.create({
      data: { userId: user.id, clinicId: clinic.id, position: input.position, permissions: input.permissions },
      include: { user: { select: { fullName: true, email: true } } },
    });
  }

  async removeStaff(userId: string, staffId: string) {
    const clinic = await getClinicByUserId(userId);

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff || staff.clinicId !== clinic.id) {
      throw { code: "NOT_FOUND", message: "Nhân viên không thuộc phòng khám này", status: 404 };
    }

    await prisma.staff.delete({ where: { id: staffId } });
    return { success: true };
  }

  // --- Stats ---

  async getStats(userId: string, userRole: string, from?: string, to?: string) {
    let clinicId: string;
    if (userRole === "STAFF") {
      clinicId = await getStaffClinicId(userId);
    } else {
      const clinic = await getClinicByUserId(userId);
      clinicId = clinic.id;
    }

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const appointmentWhere: any = { clinicId };
    if (from || to) appointmentWhere.date = dateFilter;

    const [totalAppointments, completedAppointments, totalDoctors, patients, paidPayments, cashAppointments] = await Promise.all([
      prisma.appointment.count({ where: appointmentWhere }),
      prisma.appointment.count({ where: { ...appointmentWhere, status: "COMPLETED" } }),
      prisma.doctor.count({ where: { clinicId } }),
      prisma.appointment.findMany({ where: appointmentWhere, select: { patientId: true }, distinct: ["patientId"] }),
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          appointment: appointmentWhere,
        },
        _sum: { amount: true },
      }),
      prisma.appointment.aggregate({
        where: {
          ...appointmentWhere,
          paymentStatus: "PAID",
          paymentMethod: "CASH",
          payment: null,
        },
        _sum: { amount: true },
      }),
    ]);

    const paymentRevenue = paidPayments._sum.amount || 0;
    const cashRevenue = cashAppointments._sum.amount || 0;
    const totalRevenue = paymentRevenue + cashRevenue;

    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // Top doctors
    const topDoctors = await prisma.appointment.groupBy({
      by: ["doctorId"],
      where: { ...appointmentWhere, status: "COMPLETED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topDoctorsWithDetails = await Promise.all(
      topDoctors.map(async (td) => {
        const doctor = await prisma.doctor.findUnique({
          where: { id: td.doctorId },
          include: { user: { select: { fullName: true } } },
        });
        const revenue = await prisma.payment.aggregate({
          where: { status: "PAID", appointment: { doctorId: td.doctorId, clinicId } },
          _sum: { amount: true },
        });
        return {
          name: doctor?.user.fullName || "Unknown",
          appointments: td._count.id,
          revenue: revenue._sum.amount || 0,
        };
      })
    );

    return {
      totalAppointments,
      totalRevenue,
      totalDoctors,
      totalPatients: patients.length,
      completionRate,
      topDoctors: topDoctorsWithDetails,
    };
  }

  async getChartData(userId: string, userRole: string, period: "week" | "month" | "year" = "month") {
    let clinicId: string;
    if (userRole === "STAFF") {
      clinicId = await getStaffClinicId(userId);
    } else {
      const clinic = await getClinicByUserId(userId);
      clinicId = clinic.id;
    }

    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = "day";
    } else if (period === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = "day";
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      groupFormat = "month";
    }

    const appointments = await prisma.appointment.findMany({
      where: { clinicId, date: { gte: startDate } },
      select: { date: true, amount: true, paymentStatus: true },
      orderBy: { date: "asc" },
    });

    const grouped: Record<string, { appointments: number; revenue: number }> = {};
    for (const apt of appointments) {
      const d = new Date(apt.date);
      const key = groupFormat === "day"
        ? `${d.getDate()}/${d.getMonth() + 1}`
        : `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = { appointments: 0, revenue: 0 };
      grouped[key].appointments++;
      if (apt.paymentStatus === "PAID" && apt.amount) {
        grouped[key].revenue += apt.amount;
      }
    }

    const labels = Object.keys(grouped);
    const appointmentCounts = labels.map((k) => grouped[k].appointments);
    const revenues = labels.map((k) => grouped[k].revenue);

    return { labels, appointments: appointmentCounts, revenue: revenues };
  }

  async exportData(userId: string, format: "csv" | "pdf", from?: string, to?: string) {
    const clinic = await getClinicByUserId(userId);

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    // Max 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      throw { code: "BAD_REQUEST", message: "Khoảng thời gian tối đa 1 năm", status: 400 };
    }

    const appointments = await prisma.appointment.findMany({
      where: { clinicId: clinic.id, date: { gte: startDate, lte: endDate } },
      include: {
        doctor: { include: { user: { select: { fullName: true } } } },
        patient: { select: { fullName: true } },
        payment: { select: { status: true } },
      },
      orderBy: { date: "asc" },
    });

    const rows = appointments.map((a) => ({
      Date: new Date(a.date).toLocaleDateString("vi-VN"),
      Doctor: a.doctor.user.fullName,
      Patient: a.patient.fullName,
      Status: a.status,
      Amount: a.amount || 0,
      PaymentStatus: a.paymentStatus,
    }));

    if (format === "csv") {
      return { format: "csv", data: rows, clinic: clinic.name, from: startDate, to: endDate };
    }

    return { format: "pdf", data: rows, clinic: clinic.name, from: startDate, to: endDate };
  }
}

export const clinicManagementService = new ClinicManagementService();
