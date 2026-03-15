import { prisma } from "../../lib/prisma";

export class ClinicsService {
  async findAll(page = 1, limit = 20, city?: string, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: "VERIFIED",
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { doctors: true } },
        },
      }),
      prisma.clinic.count({ where }),
    ]);

    return { clinics, total, page, limit };
  }

  async findBySlug(slug: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      include: {
        doctors: {
          where: { verificationStatus: "VERIFIED", isAvailable: true },
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
            specialty: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { doctors: true } },
      },
    });
    if (!clinic) throw { code: "NOT_FOUND", message: "Phòng khám không tồn tại", status: 404 };
    return clinic;
  }

  async getDoctors(clinicId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      clinicId,
      verificationStatus: "VERIFIED" as const,
      isAvailable: true,
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
          specialty: { select: { name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: { ratingAvg: "desc" },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page, limit };
  }
}

export const clinicsService = new ClinicsService();
