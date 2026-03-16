import { prisma } from "../../lib/prisma";
import { notify } from "../../lib/notify";
import { CreateReviewInput, UpdateReviewInput } from "@bcare/shared";

export class ReviewsService {
  async create(patientId: string, input: CreateReviewInput) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
      include: { doctor: { include: { user: { select: { id: true, fullName: true } } } } },
    });

    if (!appointment) throw { code: "NOT_FOUND", message: "Lịch hẹn không tồn tại", status: 404 };
    if (appointment.patientId !== patientId) throw { code: "FORBIDDEN", message: "Không có quyền đánh giá", status: 403 };
    if (appointment.status !== "COMPLETED") throw { code: "BAD_REQUEST", message: "Chỉ có thể đánh giá sau khi khám xong", status: 400 };

    const existingReview = await prisma.review.findUnique({ where: { appointmentId: input.appointmentId } });
    if (existingReview) throw { code: "DUPLICATE", message: "Bạn đã đánh giá lịch hẹn này", status: 409 };

    const review = await prisma.review.create({
      data: {
        patientId,
        doctorId: appointment.doctorId,
        appointmentId: input.appointmentId,
        rating: input.rating,
        comment: input.comment,
      },
    });

    // Update doctor average rating
    const { _avg } = await prisma.review.aggregate({
      where: { doctorId: appointment.doctorId },
      _avg: { rating: true },
    });
    await prisma.doctor.update({
      where: { id: appointment.doctorId },
      data: { ratingAvg: _avg.rating || 0 },
    });

    // Notify doctor
    await notify({
      userId: appointment.doctor.user.id,
      type: "REVIEW_RECEIVED",
      title: "Đánh giá mới",
      content: `Bạn nhận được đánh giá ${input.rating} sao`,
      channels: ["IN_APP", "EMAIL"],
    });

    return review;
  }

  async update(reviewId: string, patientId: string, input: UpdateReviewInput) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw { code: "NOT_FOUND", message: "Đánh giá không tồn tại", status: 404 };
    if (review.patientId !== patientId) throw { code: "FORBIDDEN", message: "Không có quyền sửa", status: 403 };

    const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) throw { code: "EXPIRED", message: "Đã quá 7 ngày, không thể sửa đánh giá", status: 400 };

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.comment !== undefined && { comment: input.comment }),
      },
    });

    if (input.rating !== undefined) {
      const { _avg } = await prisma.review.aggregate({
        where: { doctorId: review.doctorId },
        _avg: { rating: true },
      });
      await prisma.doctor.update({
        where: { id: review.doctorId },
        data: { ratingAvg: _avg.rating || 0 },
      });
    }

    return updated;
  }

  async findMyReviews(patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { patientId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          doctor: { include: { user: { select: { fullName: true, avatarUrl: true } }, specialty: { select: { name: true } } } },
          appointment: { select: { date: true, timeSlot: true } },
        },
      }),
      prisma.review.count({ where: { patientId } }),
    ]);
    return { reviews, total, page, limit };
  }
}

export const reviewsService = new ReviewsService();
