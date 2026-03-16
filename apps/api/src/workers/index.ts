import { Worker } from "bullmq";
import { createNotificationWorker } from "./notification.worker";
import { createReminderWorker } from "./reminder.worker";
import { createPaymentExpiryWorker } from "./payment-expiry.worker";

let workers: Worker[] = [];

export function startWorkers(): void {
  const notificationWorker = createNotificationWorker();
  const reminderWorker = createReminderWorker();
  const paymentExpiryWorker = createPaymentExpiryWorker();
  workers = [notificationWorker, reminderWorker, paymentExpiryWorker];

  for (const w of workers) {
    w.on("failed", (job, err) => {
      console.error(`Worker ${w.name} job ${job?.id} failed:`, err.message);
    });
  }

  console.log("BullMQ workers started: notification, reminder, payment-expiry");
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  workers = [];
  console.log("BullMQ workers stopped");
}
