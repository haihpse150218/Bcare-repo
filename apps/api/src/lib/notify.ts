import { getQueue } from "./queue";

interface NotifyOptions {
  userId: string;
  type: string;
  title: string;
  content: string;
  channels: ("IN_APP" | "EMAIL" | "SMS")[];
  metadata?: Record<string, any>;
}

export async function notify(options: NotifyOptions): Promise<void> {
  const queue = getQueue("notification");
  for (const channel of options.channels) {
    await queue.add("notification", {
      userId: options.userId,
      type: options.type,
      title: options.title,
      content: options.content,
      channel,
      metadata: options.metadata,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }
}

export async function scheduleReminder(
  appointmentId: string,
  patientId: string,
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentDateTime: Date
): Promise<void> {
  const queue = getQueue("reminder");
  const now = Date.now();

  const delay24h = appointmentDateTime.getTime() - 24 * 60 * 60 * 1000 - now;
  const delay30m = appointmentDateTime.getTime() - 30 * 60 * 1000 - now;

  const jobData = { appointmentId, patientId, doctorName, appointmentDate, appointmentTime };

  if (delay24h > 0) {
    await queue.add("reminder", { ...jobData, reminderType: "24H" as const }, {
      jobId: `reminder-24h-${appointmentId}`,
      delay: delay24h,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }

  if (delay30m > 0) {
    await queue.add("reminder", { ...jobData, reminderType: "30M" as const }, {
      jobId: `reminder-30m-${appointmentId}`,
      delay: delay30m,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }
}

export async function cancelReminders(appointmentId: string): Promise<void> {
  const queue = getQueue("reminder");
  try {
    const job24h = await queue.getJob(`reminder-24h-${appointmentId}`);
    if (job24h) await job24h.remove();
    const job30m = await queue.getJob(`reminder-30m-${appointmentId}`);
    if (job30m) await job30m.remove();
  } catch {
    // Jobs may have already been processed
  }
}
