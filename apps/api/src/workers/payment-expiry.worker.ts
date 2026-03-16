import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";

async function processPaymentExpiry(job: Job<{ paymentId: string }>) {
  const payment = await prisma.payment.findUnique({ where: { id: job.data.paymentId } });
  if (!payment || payment.status !== "PENDING") return;

  await prisma.payment.update({
    where: { id: job.data.paymentId },
    data: { status: "EXPIRED" as any },
  });
}

export function createPaymentExpiryWorker(): Worker {
  return new Worker("payment-expiry", processPaymentExpiry, {
    connection: getRedisConnection(),
    concurrency: 3,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  });
}
