import { prisma } from "../../lib/prisma";
import { notify } from "../../lib/notify";
import { getQueue } from "../../lib/queue";
import { createVNPayUrl, refundVNPay } from "./gateways/vnpay";
import { createMoMoPayment, refundMoMo } from "./gateways/momo";

export class PaymentsService {
  async createPayment(userId: string, appointmentId: string, method: "VNPAY" | "MOMO", ipAddress: string) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw { code: "NOT_FOUND", message: "Lịch hẹn không tồn tại", status: 404 };
    if (appointment.patientId !== userId) throw { code: "FORBIDDEN", message: "Không có quyền thanh toán", status: 403 };
    if (appointment.status === "CANCELLED") throw { code: "BAD_REQUEST", message: "Lịch hẹn đã bị hủy", status: 400 };

    const existing = await prisma.payment.findUnique({ where: { appointmentId } });
    if (existing && (existing.status === "PAID" || existing.status === "PENDING")) {
      if (existing.status === "PAID") throw { code: "ALREADY_PAID", message: "Đã thanh toán", status: 409 };
      throw { code: "PAYMENT_PENDING", message: "Đang có giao dịch chờ xử lý", status: 409 };
    }

    const amount = appointment.amount || 0;
    const orderId = `BCARE-${Date.now()}-${appointmentId.slice(0, 8)}`;

    const payment = existing
      ? await prisma.payment.update({
          where: { id: existing.id },
          data: {
            method: method as any,
            status: "PENDING" as any,
            transactionId: orderId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            gatewayData: undefined,
            refundAmount: null,
            refundedAt: null,
            refundReason: null,
          },
        })
      : await prisma.payment.create({
          data: {
            appointmentId,
            userId,
            amount,
            method: method as any,
            status: "PENDING" as any,
            transactionId: orderId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });

    const expiryQueue = getQueue("payment-expiry");
    await expiryQueue.add("expire", { paymentId: payment.id }, {
      jobId: `payment-expiry-${payment.id}`,
      delay: 15 * 60 * 1000,
    });

    let paymentUrl: string;
    if (method === "VNPAY") {
      paymentUrl = createVNPayUrl({
        orderId,
        amount,
        orderInfo: `Thanh toan lich hen ${appointmentId.slice(0, 8)}`,
        ipAddress,
      });
    } else {
      paymentUrl = await createMoMoPayment({
        orderId,
        amount,
        orderInfo: `Thanh toan lich hen ${appointmentId.slice(0, 8)}`,
      });
    }

    return { paymentUrl, paymentId: payment.id };
  }

  async handleIPN(transactionId: string, gatewayData: any, isSuccess: boolean) {
    const payment = await prisma.payment.findFirst({ where: { transactionId } });
    if (!payment) return;
    if (payment.status !== "PENDING") return;

    if (isSuccess) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID" as any, gatewayData },
        }),
        prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { paymentStatus: "PAID" as any },
        }),
      ]);

      await notify({
        userId: payment.userId,
        type: "PAYMENT_SUCCESS",
        title: "Thanh toán thành công",
        content: `Bạn đã thanh toán ${payment.amount.toLocaleString("vi-VN")}đ`,
        channels: ["IN_APP", "EMAIL", "SMS"],
        metadata: { paymentId: payment.id, appointmentId: payment.appointmentId },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" as any, gatewayData },
      });

      await notify({
        userId: payment.userId,
        type: "PAYMENT_FAILED",
        title: "Thanh toán thất bại",
        content: "Giao dịch không thành công. Vui lòng thử lại.",
        channels: ["IN_APP", "EMAIL"],
        metadata: { paymentId: payment.id },
      });
    }
  }

  async processRefund(appointmentId: string, cancelledBy: "PATIENT" | "DOCTOR") {
    const payment = await prisma.payment.findUnique({ where: { appointmentId } });
    if (!payment || payment.status !== "PAID") return null;

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) return null;

    const appointmentDate = new Date(appointment.date);
    const [h, m] = appointment.timeSlot.split(":").map(Number);
    appointmentDate.setHours(h, m, 0, 0);
    const hoursUntil = (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);

    let refundPercent: number;
    if (cancelledBy === "DOCTOR") {
      refundPercent = 100;
    } else if (hoursUntil >= 24) {
      refundPercent = 100;
    } else if (hoursUntil >= 2) {
      refundPercent = 50;
    } else {
      refundPercent = 0;
    }

    if (refundPercent === 0) {
      await notify({
        userId: payment.userId,
        type: "REFUND_PROCESSED",
        title: "Không thể hoàn tiền",
        content: "Hủy lịch trong vòng 2 giờ trước giờ hẹn, không được hoàn tiền.",
        channels: ["IN_APP", "EMAIL"],
      });
      return null;
    }

    const refundAmount = Math.round(payment.amount * refundPercent / 100);

    if (payment.method === "VNPAY") {
      await refundVNPay(payment.transactionId!, refundAmount, payment.transactionId!);
    } else if (payment.method === "MOMO") {
      await refundMoMo(payment.transactionId!, refundAmount, payment.transactionId!);
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED" as any,
          refundAmount,
          refundedAt: new Date(),
          refundReason: cancelledBy === "DOCTOR" ? "Bác sĩ hủy lịch" : "Bệnh nhân hủy lịch",
        },
      }),
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { paymentStatus: "REFUNDED" as any },
      }),
    ]);

    await notify({
      userId: payment.userId,
      type: "REFUND_PROCESSED",
      title: "Hoàn tiền thành công",
      content: `Đã hoàn ${refundAmount.toLocaleString("vi-VN")}đ (${refundPercent}%)`,
      channels: ["IN_APP", "EMAIL"],
      metadata: { paymentId: payment.id },
    });

    return { refundAmount, refundPercent };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          appointment: {
            select: {
              date: true,
              timeSlot: true,
              doctor: { include: { user: { select: { fullName: true } } } },
            },
          },
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);
    return { payments, total, page, limit };
  }

  async getById(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          select: {
            date: true,
            timeSlot: true,
            status: true,
            doctor: { include: { user: { select: { fullName: true } }, specialty: { select: { name: true } } } },
            clinic: { select: { name: true, address: true } },
          },
        },
      },
    });
    if (!payment) throw { code: "NOT_FOUND", message: "Không tìm thấy giao dịch", status: 404 };
    if (payment.userId !== userId) throw { code: "FORBIDDEN", message: "Không có quyền xem", status: 403 };
    return payment;
  }
}

export const paymentsService = new PaymentsService();
