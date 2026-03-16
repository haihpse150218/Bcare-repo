import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../lib/redis";
import { getQueue } from "../lib/queue";

export interface ReminderJobData {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reminderType: "24H" | "30M";
}

async function processReminder(job: Job<ReminderJobData>) {
  const { patientId, doctorName, appointmentDate, appointmentTime, reminderType } = job.data;
  const queue = getQueue("notification");

  const timeLabel = reminderType === "24H" ? "24 giờ" : "30 phút";
  const title = `Nhắc lịch hẹn — còn ${timeLabel}`;
  const content = `Bạn có lịch hẹn với ${doctorName} vào ${appointmentTime} ngày ${appointmentDate}`;
  const type = reminderType === "24H" ? "APPOINTMENT_REMINDER_24H" : "APPOINTMENT_REMINDER_30M";

  const channels: ("IN_APP" | "EMAIL" | "SMS")[] =
    reminderType === "24H" ? ["IN_APP", "EMAIL", "SMS"] : ["IN_APP", "SMS"];

  for (const channel of channels) {
    await queue.add("notification", {
      userId: patientId,
      type,
      title,
      content,
      channel,
      metadata: { appointmentId: job.data.appointmentId },
    });
  }
}

export function createReminderWorker(): Worker {
  return new Worker("reminder", processReminder, {
    connection: getRedisConnection(),
    concurrency: 3,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });
}
