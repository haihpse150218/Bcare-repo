import { prisma } from "../../lib/prisma";
import { ListDoctorsInput } from "./doctors.schema";

export class DoctorsService {
  async findAll(input: ListDoctorsInput) {
    const { page, limit, specialty, city, search, sort, order } = input;
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: "VERIFIED",
      isAvailable: true,
    };

    if (specialty) where.specialty = { slug: specialty };
    if (city) where.clinic = { city: { contains: city, mode: "insensitive" } };
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { specialty: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const sortMap: Record<string, any> = {
      rating: { ratingAvg: order },
      experience: { experienceYears: order },
      fee: { consultationFee: order },
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortMap[sort] || { ratingAvg: "desc" },
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
          specialty: { select: { name: true, slug: true } },
          clinic: { select: { name: true, city: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page, limit };
  }

  async findBySlug(slug: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { slug },
      include: {
        user: { select: { fullName: true, avatarUrl: true, phone: true } },
        specialty: true,
        clinic: { select: { name: true, slug: true, address: true, city: true, phone: true } },
        schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { appointment: { include: { patient: { select: { fullName: true, avatarUrl: true } } } } },
        },
        _count: { select: { reviews: true, appointments: true } },
      },
    });
    if (!doctor) throw { code: "NOT_FOUND", message: "Bác sĩ không tồn tại", status: 404 };
    return doctor;
  }

  async getSchedules(doctorId: string) {
    return prisma.schedule.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async getReviews(doctorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { doctorId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { doctorId } }),
    ]);
    return { reviews, total, page, limit };
  }
}

export const doctorsService = new DoctorsService();
