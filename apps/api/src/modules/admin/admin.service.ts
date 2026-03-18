import { prisma } from "../../lib/prisma";

export class AdminService {
  async getDashboard() {
    const [totalUsers, totalDoctors, totalClinics, totalAppointments, totalRevenue, recentAppointments] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.clinic.count(),
      prisma.appointment.count(),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.appointment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { fullName: true } },
          doctor: { include: { user: { select: { fullName: true } } } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalDoctors,
      totalClinics,
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentAppointments,
    };
  }

  async listUsers(page = 1, limit = 20, role?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, phone: true, fullName: true, role: true, isVerified: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async updateUser(userId: string, data: { isVerified?: boolean; role?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw { code: "NOT_FOUND", message: "Người dùng không tồn tại", status: 404 };

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
        ...(data.role !== undefined && { role: data.role as any }),
      },
      select: { id: true, email: true, fullName: true, role: true, isVerified: true },
    });
  }

  async listAppointments(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { fullName: true, email: true } },
          doctor: { include: { user: { select: { fullName: true } } } },
          clinic: { select: { name: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total, page, limit };
  }

  async listPayments(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true } },
          appointment: { select: { date: true, timeSlot: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page, limit };
  }

  async getRevenueReport(period: "week" | "month" | "year" = "month") {
    const now = new Date();
    let startDate: Date;

    if (period === "week") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === "month") startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const payments = await prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true, method: true },
      orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, { revenue: number; count: number }> = {};
    for (const p of payments) {
      const d = new Date(p.createdAt);
      const key = period === "year"
        ? `${d.getMonth() + 1}/${d.getFullYear()}`
        : `${d.getDate()}/${d.getMonth() + 1}`;
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 };
      grouped[key].revenue += p.amount;
      grouped[key].count++;
    }

    const labels = Object.keys(grouped);
    return {
      labels,
      revenue: labels.map((k) => grouped[k].revenue),
      transactions: labels.map((k) => grouped[k].count),
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: payments.length,
    };
  }

  // Specialties management
  async listSpecialties() {
    return prisma.specialty.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { doctors: true } } } });
  }

  async createSpecialty(data: { name: string; slug: string; icon?: string; description?: string }) {
    return prisma.specialty.create({ data });
  }

  async updateSpecialty(id: string, data: { name?: string; slug?: string; icon?: string; description?: string }) {
    return prisma.specialty.update({ where: { id }, data });
  }

  async deleteSpecialty(id: string) {
    const count = await prisma.doctor.count({ where: { specialtyId: id } });
    if (count > 0) throw { code: "CONFLICT", message: `Không thể xóa, có ${count} bác sĩ thuộc chuyên khoa này`, status: 409 };
    await prisma.specialty.delete({ where: { id } });
    return { deleted: true };
  }

  // Doctor verification
  async verifyDoctor(doctorId: string, status: "VERIFIED" | "REJECTED") {
    return prisma.doctor.update({
      where: { id: doctorId },
      data: { verificationStatus: status },
      include: { user: { select: { fullName: true, email: true } } },
    });
  }

  // Clinic verification
  async verifyClinic(clinicId: string, status: "VERIFIED" | "REJECTED") {
    return prisma.clinic.update({
      where: { id: clinicId },
      data: { verificationStatus: status },
      include: { user: { select: { fullName: true, email: true } } },
    });
  }
}

export const adminService = new AdminService();
