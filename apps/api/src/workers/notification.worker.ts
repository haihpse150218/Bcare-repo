import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import { sendSMS } from "../lib/sms";

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  content: string;
  channel: "IN_APP" | "EMAIL" | "SMS";
  metadata?: Record<string, any>;
}

async function getUserPreferences(userId: string) {
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  return pref || { email: true, sms: true, inApp: true };
}

async function getUserContact(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true },
  });
}

async function processNotification(job: Job<NotificationJobData>) {
  const { userId, type, title, content, channel } = job.data;
  const prefs = await getUserPreferences(userId);
  const user = await getUserContact(userId);
  if (!user) return;

  switch (channel) {
    case "IN_APP":
      if (!prefs.inApp) return;
      await prisma.notification.create({
        data: {
          userId,
          title,
          content,
          type: type as any,
          channel: "IN_APP" as any,
          sentAt: new Date(),
        },
      });
      break;

    case "EMAIL":
      if (!prefs.email) return;
      const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#0891b2">${title}</h2>
        <p>${content}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#6b7280;font-size:12px">BCare — Đặt lịch khám bệnh trực tuyến</p>
      </div>`;
      await sendEmail(user.email, title, html);
      break;

    case "SMS":
      if (!prefs.sms) return;
      await sendSMS(user.phone, `${title}: ${content}`);
      break;
  }
}

export function createNotificationWorker(): Worker {
  return new Worker("notification", processNotification, {
    connection: getRedisConnection(),
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });
}
