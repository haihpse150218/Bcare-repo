import { prisma } from "../../lib/prisma";

export class SpecialtiesService {
  async findAll() {
    return prisma.specialty.findMany({
      include: { _count: { select: { doctors: true } } },
      orderBy: { name: "asc" },
    });
  }

  async findBySlug(slug: string) {
    const specialty = await prisma.specialty.findUnique({ where: { slug } });
    if (!specialty) throw { code: "NOT_FOUND", message: "Chuyên khoa không tồn tại", status: 404 };
    return specialty;
  }
}

export const specialtiesService = new SpecialtiesService();
