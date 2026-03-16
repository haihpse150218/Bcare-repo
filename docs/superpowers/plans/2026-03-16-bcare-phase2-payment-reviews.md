# BCare Phase 2 — Payment + Reviews Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add payment processing (VNPay + MoMo sandbox), doctor review system, and multi-channel notifications (email + SMS + in-app) powered by BullMQ job queue.

**Architecture:** Extend existing Fastify API with new payment/review modules and BullMQ workers running in-process. Payment gateways integrated via sandbox APIs. Notifications dispatched as separate jobs per channel through BullMQ queues.

**Tech Stack:** Fastify, Prisma, BullMQ, ioredis, Resend (email), eSMS.vn (SMS), VNPay sandbox, MoMo sandbox, Next.js, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-16-bcare-phase2-payment-reviews-design.md`

---

## Chunk 1: Schema + Dependencies + BullMQ Infrastructure

### Task 1: Update Prisma schema with Phase 2 models and enums

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Modify: `packages/shared/src/types/appointment.ts`
- Modify: `packages/shared/src/types/notification.ts`
- Create: `packages/shared/src/types/payment.ts`
- Create: `packages/shared/src/types/review.ts`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add TransactionStatus enum and Payment model to Prisma schema**

Add after line 37 (after PaymentMethod enum) in `packages/db/prisma/schema.prisma`:

```prisma
enum TransactionStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  EXPIRED
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
}
```

Add the Payment model after the Appointment model (after line 175):

```prisma
model Payment {
  id            String            @id @default(uuid())
  appointmentId String            @unique @map("appointment_id")
  userId        String            @map("user_id")
  amount        Int
  method        PaymentMethod
  status        TransactionStatus @default(PENDING)
  transactionId String?           @map("transaction_id")
  gatewayData   Json?             @map("gateway_data")
  refundAmount  Int?              @map("refund_amount")
  refundedAt    DateTime?         @map("refunded_at")
  refundReason  String?           @map("refund_reason")
  expiresAt     DateTime?         @map("expires_at")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")

  appointment Appointment @relation(fields: [appointmentId], references: [id])
  user        User        @relation(fields: [userId], references: [id])

  @@map("payments")
}
```

Add the NotificationPreference model after the Notification model:

```prisma
model NotificationPreference {
  id     String  @id @default(uuid())
  userId String  @unique @map("user_id")
  email  Boolean @default(true)
  sms    Boolean @default(true)
  inApp  Boolean @default(true) @map("in_app")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}
```

- [ ] **Step 2: Update existing models with new fields and relations**

Add `updatedAt` to Appointment model (after `createdAt` line 165):
```prisma
  updatedAt     DateTime          @updatedAt @map("updated_at")
```

Add `payment` relation to Appointment model (after `review` line 171):
```prisma
  payment  Payment?
```

Add `updatedAt` to Review model (after `createdAt` line 184):
```prisma
  updatedAt DateTime @updatedAt @map("updated_at")
```

Add `channel` and `sentAt` to Notification model (after `isRead` line 199):
```prisma
  channel   NotificationChannel? @default(IN_APP)
  sentAt    DateTime?            @map("sent_at")
```

Add to User model relations (after `auditLogs` line 71):
```prisma
  payments               Payment[]
  notificationPreference NotificationPreference?
```

Update NotificationType enum to add new types:
```prisma
enum NotificationType {
  APPOINTMENT_CREATED
  APPOINTMENT_CONFIRMED
  APPOINTMENT_CANCELLED
  APPOINTMENT_REMINDER
  APPOINTMENT_REMINDER_24H
  APPOINTMENT_REMINDER_30M
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  REFUND_PROCESSED
  REVIEW_RECEIVED
  GENERAL
}
```

- [ ] **Step 3: Add shared TypeScript types for Payment and Review**

Create `packages/shared/src/types/payment.ts`:
```typescript
export enum TransactionStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export interface Payment {
  id: string;
  appointmentId: string;
  userId: string;
  amount: number;
  method: string;
  status: TransactionStatus;
  transactionId: string | null;
  gatewayData: any;
  refundAmount: number | null;
  refundedAt: Date | null;
  refundReason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
}
```

Create `packages/shared/src/types/review.ts`:
```typescript
export interface Review {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Update `packages/shared/src/types/notification.ts` — add new enum values:
```typescript
export enum NotificationType {
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
  APPOINTMENT_REMINDER_24H = "APPOINTMENT_REMINDER_24H",
  APPOINTMENT_REMINDER_30M = "APPOINTMENT_REMINDER_30M",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUND_PROCESSED = "REFUND_PROCESSED",
  REVIEW_RECEIVED = "REVIEW_RECEIVED",
  GENERAL = "GENERAL",
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  channel?: string;
  sentAt?: Date;
  createdAt: Date;
}
```

Update `packages/shared/src/types/index.ts`:
```typescript
export * from "./user";
export * from "./doctor";
export * from "./clinic";
export * from "./appointment";
export * from "./notification";
export * from "./payment";
export * from "./review";
```

- [ ] **Step 4: Run Prisma generate and push schema**

Run:
```bash
cd packages/db && npx prisma generate && npx prisma db push
```

Expected: Schema pushed successfully, Prisma client regenerated.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/shared/src/types/
git commit -m "feat(schema): add Payment, NotificationPreference models and Phase 2 enums"
```

---

### Task 2: Install Phase 2 dependencies and configure Redis

**Files:**
- Modify: `apps/api/package.json`
- Modify: `.env.example`
- Modify: `docker-compose.yml`
- Create: `apps/api/src/lib/redis.ts`
- Create: `apps/api/src/lib/queue.ts`

- [ ] **Step 1: Install BullMQ, ioredis, Resend**

Run:
```bash
cd apps/api && npm install bullmq ioredis resend
```

- [ ] **Step 2: Add Redis service to docker-compose.yml**

Add after the `web` service definition in `docker-compose.yml`:

```yaml
  redis:
    image: redis:7-alpine
    container_name: bcare-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
```

Add `redisdata:` to the `volumes:` section at the bottom.

Add `REDIS_URL: redis://redis:6379` to the `api` service environment and add `redis` to its `depends_on`.

- [ ] **Step 3: Update .env.example with Phase 2 variables**

Append to `.env.example`:
```env
# Redis
REDIS_URL=redis://localhost:6379

# VNPay Sandbox
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpay.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/result
VNPAY_IPN_URL=http://localhost:3001/api/payments/vnpay/ipn

# MoMo Sandbox
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:3000/payment/result
MOMO_IPN_URL=http://localhost:3001/api/payments/momo/ipn

# Resend (Email)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@bcare.vn

# eSMS (SMS)
ESMS_API_KEY=your_api_key
ESMS_SECRET_KEY=your_secret_key
ESMS_BRAND_NAME=BCare
```

- [ ] **Step 4: Create Redis connection module**

Create `apps/api/src/lib/redis.ts`:
```typescript
import IORedis from "ioredis";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
```

- [ ] **Step 5: Create BullMQ queue factory**

Create `apps/api/src/lib/queue.ts`:
```typescript
import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

const queues: Map<string, Queue> = new Map();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: getRedisConnection() }));
  }
  return queues.get(name)!;
}

export async function closeAllQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/package.json package-lock.json .env.example docker-compose.yml apps/api/src/lib/redis.ts apps/api/src/lib/queue.ts
git commit -m "feat: add BullMQ, Redis, Resend dependencies and queue infrastructure"
```

---

### Task 3: Create BullMQ notification and reminder workers

**Files:**
- Create: `apps/api/src/workers/notification.worker.ts`
- Create: `apps/api/src/workers/reminder.worker.ts`
- Create: `apps/api/src/workers/payment-expiry.worker.ts`
- Create: `apps/api/src/workers/index.ts`
- Create: `apps/api/src/lib/email.ts`
- Create: `apps/api/src/lib/sms.ts`
- Modify: `apps/api/src/server.ts`

- [ ] **Step 1: Create email service (Resend)**

Create `apps/api/src/lib/email.ts`:
```typescript
import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "re_test_key");
  }
  return resend;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const from = process.env.EMAIL_FROM || "BCare <noreply@bcare.vn>";
    await getResend().emails.send({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}
```

- [ ] **Step 2: Create SMS service (eSMS.vn)**

Create `apps/api/src/lib/sms.ts`:
```typescript
export async function sendSMS(phone: string, content: string): Promise<boolean> {
  try {
    const apiKey = process.env.ESMS_API_KEY;
    const secretKey = process.env.ESMS_SECRET_KEY;
    const brandName = process.env.ESMS_BRAND_NAME || "BCare";

    if (!apiKey || !secretKey) {
      console.warn("eSMS credentials not configured, skipping SMS");
      return false;
    }

    const res = await fetch(
      "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ApiKey: apiKey,
          Content: content,
          Phone: phone,
          SecretKey: secretKey,
          SmsType: "2",
          Brandname: brandName,
        }),
      }
    );

    const data = await res.json();
    return data.CodeResult === "100";
  } catch (err) {
    console.error("SMS send failed:", err);
    return false;
  }
}
```

- [ ] **Step 3: Create notification worker**

Create `apps/api/src/workers/notification.worker.ts`:
```typescript
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
```

- [ ] **Step 4: Create reminder worker**

Create `apps/api/src/workers/reminder.worker.ts`:
```typescript
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
```

- [ ] **Step 5: Create payment expiry worker**

Create `apps/api/src/workers/payment-expiry.worker.ts`:
```typescript
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
```

- [ ] **Step 6: Create worker index with lifecycle management**

Create `apps/api/src/workers/index.ts`:
```typescript
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
```

- [ ] **Step 7: Integrate workers into server lifecycle**

Modify `apps/api/src/server.ts` — add worker startup after listen and graceful shutdown:

```typescript
// Load .env from monorepo root (skip if env already set, e.g. in Docker)
if (!process.env.DATABASE_URL) {
  const { config } = require("dotenv");
  const { resolve } = require("path");
  config({ path: resolve(__dirname, "../../../.env") });
}

import { buildApp } from "./app";
import { startWorkers, stopWorkers } from "./workers";
import { closeRedisConnection } from "./lib/redis";
import { closeAllQueues } from "./lib/queue";

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || "3001");

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`API server running on http://localhost:${port}`);
    startWorkers();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    console.log("Shutting down...");
    await stopWorkers();
    await closeAllQueues();
    await closeRedisConnection();
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/workers/ apps/api/src/lib/email.ts apps/api/src/lib/sms.ts apps/api/src/server.ts
git commit -m "feat: add BullMQ notification/reminder/payment-expiry workers with email and SMS channels"
```

---

### Task 4: Create notification dispatcher helper

**Files:**
- Create: `apps/api/src/lib/notify.ts`

- [ ] **Step 1: Create notification dispatcher**

This is the central function all services call to enqueue notifications. It dispatches one job per channel.

Create `apps/api/src/lib/notify.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/notify.ts
git commit -m "feat: add notification dispatcher with reminder scheduling"
```

---

## Chunk 2: Review System (Backend + Frontend)

### Task 5: Add review validation schemas to shared package

**Files:**
- Create: `packages/shared/src/schemas/review.schema.ts`
- Modify: `packages/shared/src/schemas/index.ts`

- [ ] **Step 1: Create review schemas**

Create `packages/shared/src/schemas/review.schema.ts`:
```typescript
import { z } from "zod";

export const createReviewSchema = z.object({
  appointmentId: z.string().uuid("ID lịch hẹn không hợp lệ"),
  rating: z.number().int().min(1, "Đánh giá tối thiểu 1 sao").max(5, "Đánh giá tối đa 5 sao"),
  comment: z.string().max(500, "Nhận xét tối đa 500 ký tự").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
```

Create `packages/shared/src/schemas/payment.schema.ts`:
```typescript
import { z } from "zod";

export const createPaymentSchema = z.object({
  method: z.enum(["VNPAY", "MOMO"], { required_error: "Vui lòng chọn phương thức thanh toán" }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
```

- [ ] **Step 2: Export from schemas index**

Modify `packages/shared/src/schemas/index.ts` — add:
```typescript
export * from "./review.schema";
export * from "./payment.schema";
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/schemas/
git commit -m "feat: add review validation schemas"
```

---

### Task 6: Create review API module

**Files:**
- Create: `apps/api/src/modules/reviews/reviews.service.ts`
- Create: `apps/api/src/modules/reviews/reviews.controller.ts`
- Create: `apps/api/src/modules/reviews/reviews.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create reviews service**

Create `apps/api/src/modules/reviews/reviews.service.ts`:
```typescript
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

    // Recalculate average if rating changed
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
```

- [ ] **Step 2: Create reviews controller**

Create `apps/api/src/modules/reviews/reviews.controller.ts`:
```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { reviewsService } from "./reviews.service";
import { success } from "../../lib/response";
import { CreateReviewInput, UpdateReviewInput } from "@bcare/shared";

export async function createReviewController(
  request: FastifyRequest<{ Body: CreateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const review = await reviewsService.create(id, request.body);
    reply.status(201).send(success(review));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function updateReviewController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const review = await reviewsService.update(request.params.id, userId, request.body);
    reply.send(success(review));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function myReviewsController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await reviewsService.findMyReviews(id, page, limit);
    reply.send(success(result.reviews, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
```

- [ ] **Step 3: Create reviews routes**

Create `apps/api/src/modules/reviews/reviews.routes.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { createReviewController, updateReviewController, myReviewsController } from "./reviews.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, createReviewSchema, updateReviewSchema } from "@bcare/shared";

export async function reviewsRoutes(app: FastifyInstance) {
  app.post("/api/reviews", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(createReviewSchema)],
    config: { rateLimit: { max: 5, timeWindow: "1 hour" } },
  }, createReviewController);

  app.put<{ Params: { id: string } }>("/api/reviews/:id", {
    preHandler: [authenticate, authorize(Role.PATIENT), validate(updateReviewSchema)],
  }, updateReviewController);

  app.get("/api/reviews/my", {
    preHandler: [authenticate, authorize(Role.PATIENT)],
  }, myReviewsController);
}
```

- [ ] **Step 4: Register reviews routes in app.ts**

Add import to `apps/api/src/app.ts`:
```typescript
import { reviewsRoutes } from "./modules/reviews/reviews.routes";
```

Add registration after `schedulesRoutes`:
```typescript
  await app.register(reviewsRoutes);
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/reviews/ apps/api/src/app.ts
git commit -m "feat: add review API — create, update, list with rating recalculation"
```

---

### Task 7: Add review frontend components

**Files:**
- Create: `apps/web/components/reviews/review-form.tsx`
- Create: `apps/web/components/reviews/review-display.tsx`
- Modify: `apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx`

- [ ] **Step 1: Create ReviewForm component**

Create `apps/web/components/reviews/review-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface ReviewFormProps {
  appointmentId: string;
  onSubmit?: (review: any) => void;
}

export function ReviewForm({ appointmentId, onSubmit }: ReviewFormProps) {
  const { token } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
    setLoading(true);
    try {
      const review = await api("/api/reviews", {
        method: "POST",
        token,
        body: JSON.stringify({ appointmentId, rating, comment: comment || undefined }),
      });
      toast.success("Đánh giá thành công!");
      onSubmit?.(review);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Đánh giá bác sĩ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHover(i + 1)}
                onMouseLeave={() => setHover(0)}
                className="p-0.5"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    i < (hover || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Nhận xét (không bắt buộc, tối đa 500 ký tự)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create ReviewDisplay component**

Create `apps/web/components/reviews/review-display.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface ReviewDisplayProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  };
  onUpdate?: (review: any) => void;
}

export function ReviewDisplay({ review, onUpdate }: ReviewDisplayProps) {
  const { token } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review.comment || "");
  const [loading, setLoading] = useState(false);

  const daysSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const canEdit = daysSinceCreation <= 7;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api(`/api/reviews/${review.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      toast.success("Cập nhật đánh giá thành công!");
      setEditing(false);
      onUpdate?.(updated);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sửa đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHover(i + 1)}
                  onMouseLeave={() => setHover(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      i < (hover || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} />
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Đánh giá của bạn</CardTitle>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-1" /> Sửa
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-5 h-5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
          ))}
        </div>
        {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
        <p className="text-xs text-gray-400 mt-2">
          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
          {canEdit && ` · Có thể sửa trong ${Math.ceil(7 - daysSinceCreation)} ngày`}
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Integrate review components into appointment detail page**

Read the current appointment detail page at `apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx` and add:

After the appointment details section, add the review section:

```tsx
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewDisplay } from "@/components/reviews/review-display";
```

In the component body, add state for review:
```tsx
const [review, setReview] = useState<any>(null);
```

In the data fetching effect, also fetch the review for this appointment (check if appointment status is COMPLETED and if a review exists via `/api/doctors/:doctorId/reviews`).

After the appointment info card, render conditionally:
```tsx
{appointment?.status === "COMPLETED" && (
  <div className="mt-6">
    {review ? (
      <ReviewDisplay review={review} onUpdate={(r) => setReview(r)} />
    ) : (
      <ReviewForm appointmentId={id} onSubmit={(r) => setReview(r)} />
    )}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/reviews/ apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx
git commit -m "feat: add review form and display components with appointment detail integration"
```

---

## Chunk 3: Payment System (Backend)

### Task 8: Create VNPay gateway service

**Files:**
- Create: `apps/api/src/modules/payments/gateways/vnpay.ts`

- [ ] **Step 1: Create VNPay gateway**

Create `apps/api/src/modules/payments/gateways/vnpay.ts`:
```typescript
import crypto from "crypto";

interface VNPayCreateParams {
  orderId: string;
  amount: number; // VND
  orderInfo: string;
  ipAddress: string;
}

export function createVNPayUrl(params: VNPayCreateParams): string {
  const tmnCode = process.env.VNPAY_TMN_CODE || "";
  const hashSecret = process.env.VNPAY_HASH_SECRET || "";
  const vnpUrl = process.env.VNPAY_URL || "https://sandbox.vnpay.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment/result";

  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  const ipnUrl = process.env.VNPAY_IPN_URL || "http://localhost:3001/api/payments/vnpay/ipn";

  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(params.amount * 100), // VNPay uses amount * 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpnUrl: ipnUrl,
    vnp_IpAddr: params.ipAddress,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sortedParams = sortObject(vnpParams);
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  sortedParams.vnp_SecureHash = signed;
  return `${vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;
}

export function verifyVNPaySignature(query: Record<string, string>): boolean {
  const hashSecret = process.env.VNPAY_HASH_SECRET || "";
  const secureHash = query.vnp_SecureHash;
  if (!secureHash) return false;

  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
}

export async function refundVNPay(transactionId: string, amount: number, orderId: string): Promise<boolean> {
  // In sandbox mode, refund is simulated
  console.log(`VNPay refund: txn=${transactionId}, amount=${amount}, order=${orderId}`);
  return true;
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj).sort().reduce((result: Record<string, string>, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/payments/
git commit -m "feat: add VNPay sandbox gateway service"
```

---

### Task 9: Create MoMo gateway service

**Files:**
- Create: `apps/api/src/modules/payments/gateways/momo.ts`

- [ ] **Step 1: Create MoMo gateway**

Create `apps/api/src/modules/payments/gateways/momo.ts`:
```typescript
import crypto from "crypto";

interface MoMoCreateParams {
  orderId: string;
  amount: number;
  orderInfo: string;
}

interface MoMoResponse {
  payUrl: string;
  resultCode: number;
  message: string;
}

export async function createMoMoPayment(params: MoMoCreateParams): Promise<string> {
  const partnerCode = process.env.MOMO_PARTNER_CODE || "";
  const accessKey = process.env.MOMO_ACCESS_KEY || "";
  const secretKey = process.env.MOMO_SECRET_KEY || "";
  const momoUrl = process.env.MOMO_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
  const redirectUrl = process.env.MOMO_RETURN_URL || "http://localhost:3000/payment/result";
  const ipnUrl = process.env.MOMO_IPN_URL || "http://localhost:3001/api/payments/momo/ipn";

  const requestId = `${partnerCode}-${Date.now()}`;
  const requestType = "payWithMethod";
  const extraData = "";

  const rawSignature = `accessKey=${accessKey}&amount=${params.amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

  const body = {
    partnerCode,
    partnerName: "BCare",
    storeId: "BCareStore",
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    extraData,
    signature,
  };

  const res = await fetch(momoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: MoMoResponse = await res.json();
  if (data.resultCode !== 0) {
    throw { code: "MOMO_ERROR", message: data.message || "Lỗi tạo thanh toán MoMo", status: 502 };
  }

  return data.payUrl;
}

export function verifyMoMoSignature(body: Record<string, any>): boolean {
  const accessKey = process.env.MOMO_ACCESS_KEY || "";
  const secretKey = process.env.MOMO_SECRET_KEY || "";

  const rawSignature = `accessKey=${accessKey}&amount=${body.amount}&extraData=${body.extraData}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;

  const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
  return signature === body.signature;
}

export async function refundMoMo(transactionId: string, amount: number, orderId: string): Promise<boolean> {
  // In sandbox mode, refund is simulated
  console.log(`MoMo refund: txn=${transactionId}, amount=${amount}, order=${orderId}`);
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/payments/gateways/momo.ts
git commit -m "feat: add MoMo sandbox gateway service"
```

---

### Task 10: Create payment service, controller, and routes

**Files:**
- Create: `apps/api/src/modules/payments/payments.service.ts`
- Create: `apps/api/src/modules/payments/payments.controller.ts`
- Create: `apps/api/src/modules/payments/payments.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create payments service**

Create `apps/api/src/modules/payments/payments.service.ts`:
```typescript
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

    // Check for existing active payment
    const existing = await prisma.payment.findUnique({ where: { appointmentId } });
    if (existing && (existing.status === "PAID" || existing.status === "PENDING")) {
      if (existing.status === "PAID") throw { code: "ALREADY_PAID", message: "Đã thanh toán", status: 409 };
      throw { code: "PAYMENT_PENDING", message: "Đang có giao dịch chờ xử lý", status: 409 };
    }

    const amount = appointment.amount || 0;
    const orderId = `BCARE-${Date.now()}-${appointmentId.slice(0, 8)}`;

    // Upsert: update EXPIRED/FAILED payment or create new
    const payment = existing
      ? await prisma.payment.update({
          where: { id: existing.id },
          data: {
            method: method as any,
            status: "PENDING" as any,
            transactionId: orderId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            gatewayData: null,
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

    // Schedule expiry job on dedicated payment-expiry queue
    const expiryQueue = getQueue("payment-expiry");
    await expiryQueue.add("expire", { paymentId: payment.id }, {
      jobId: `payment-expiry-${payment.id}`,
      delay: 15 * 60 * 1000,
    });

    // Create gateway URL
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
    if (payment.status !== "PENDING") return; // Idempotent

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

    // Calculate refund tier
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

    // Call gateway refund
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
```

- [ ] **Step 2: Create payments controller**

Create `apps/api/src/modules/payments/payments.controller.ts`:
```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { paymentsService } from "./payments.service";
import { verifyVNPaySignature } from "./gateways/vnpay";
import { verifyMoMoSignature } from "./gateways/momo";
import { success } from "../../lib/response";

export async function createPaymentController(
  request: FastifyRequest<{ Params: { appointmentId: string }; Body: { method: "VNPAY" | "MOMO" } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const ip = request.ip || "127.0.0.1";
    const result = await paymentsService.createPayment(id, request.params.appointmentId, request.body.method, ip);
    reply.send(success(result));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function vnpayCallbackController(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  // Display-only redirect — actual processing via IPN
  const responseCode = request.query.vnp_ResponseCode;
  const txnRef = request.query.vnp_TxnRef;
  reply.redirect(`${process.env.WEB_URL || "http://localhost:3000"}/payment/result?status=${responseCode === "00" ? "success" : "failed"}&ref=${txnRef}`);
}

export async function vnpayIPNController(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const isValid = verifyVNPaySignature(request.query as Record<string, string>);
  if (!isValid) {
    reply.send({ RspCode: "97", Message: "Invalid signature" });
    return;
  }

  const isSuccess = request.query.vnp_ResponseCode === "00";
  await paymentsService.handleIPN(request.query.vnp_TxnRef, request.query, isSuccess);
  reply.send({ RspCode: "00", Message: "Confirm Success" });
}

export async function momoCallbackController(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const resultCode = request.query.resultCode;
  const orderId = request.query.orderId;
  reply.redirect(`${process.env.WEB_URL || "http://localhost:3000"}/payment/result?status=${resultCode === "0" ? "success" : "failed"}&ref=${orderId}`);
}

export async function momoIPNController(
  request: FastifyRequest<{ Body: Record<string, any> }>,
  reply: FastifyReply
) {
  const isValid = verifyMoMoSignature(request.body);
  if (!isValid) {
    reply.status(400).send({ message: "Invalid signature" });
    return;
  }

  const isSuccess = request.body.resultCode === 0;
  await paymentsService.handleIPN(request.body.orderId, request.body, isSuccess);
  reply.status(204).send();
}

export async function paymentHistoryController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "20");
    const result = await paymentsService.getHistory(id, page, limit);
    reply.send(success(result.payments, { page: result.page, limit: result.limit, total: result.total }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function paymentDetailController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: userId } = request.user as { id: string };
    const payment = await paymentsService.getById(request.params.id, userId);
    reply.send(success(payment));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
```

- [ ] **Step 3: Create payments routes**

Create `apps/api/src/modules/payments/payments.routes.ts`:
```typescript
import { FastifyInstance } from "fastify";
import {
  createPaymentController,
  vnpayCallbackController,
  vnpayIPNController,
  momoCallbackController,
  momoIPNController,
  paymentHistoryController,
  paymentDetailController,
} from "./payments.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { Role, createPaymentSchema } from "@bcare/shared";

export async function paymentsRoutes(app: FastifyInstance) {
  // Create payment (patient only)
  app.post<{ Params: { appointmentId: string }; Body: { method: "VNPAY" | "MOMO" } }>(
    "/api/payments/:appointmentId/create",
    { preHandler: [authenticate, authorize(Role.PATIENT), validate(createPaymentSchema)] },
    createPaymentController
  );

  // Gateway callbacks (public — redirected from payment gateway)
  app.get("/api/payments/vnpay/callback", vnpayCallbackController);
  app.get("/api/payments/momo/callback", momoCallbackController);

  // IPN webhooks (public — called server-to-server by gateway)
  // Note: VNPay IPN uses GET with query params, MoMo uses POST with body
  app.get("/api/payments/vnpay/ipn", vnpayIPNController);
  app.post("/api/payments/momo/ipn", momoIPNController);

  // Payment history and detail (patient)
  app.get("/api/payments/history", { preHandler: [authenticate] }, paymentHistoryController);
  app.get<{ Params: { id: string } }>("/api/payments/:id", { preHandler: [authenticate] }, paymentDetailController);
}
```

- [ ] **Step 4: Register payments routes in app.ts**

Add to `apps/api/src/app.ts`:
```typescript
import { paymentsRoutes } from "./modules/payments/payments.routes";
```

Register after `reviewsRoutes`:
```typescript
  await app.register(paymentsRoutes);
```

- [ ] **Step 5: Integrate refund into appointment cancellation**

Modify `apps/api/src/modules/appointments/appointments.service.ts` — update the `updateStatus` method to handle refund and determine `cancelledBy` from caller context:

```typescript
  async updateStatus(id: string, status: string, cancelledByRole?: string) {
    const result = await prisma.appointment.update({
      where: { id },
      data: { status: status as any },
      include: {
        doctor: { include: { user: { select: { id: true, fullName: true } } } },
        patient: { select: { id: true, fullName: true } },
      },
    });

    // Process refund on cancellation
    if (status === "CANCELLED") {
      const cancelledBy = (cancelledByRole === "DOCTOR" || cancelledByRole === "STAFF") ? "DOCTOR" : "PATIENT";
      const { paymentsService } = await import("../payments/payments.service");
      await paymentsService.processRefund(id, cancelledBy as "PATIENT" | "DOCTOR");
      // Cancel reminders
      const { cancelReminders } = await import("../../lib/notify");
      await cancelReminders(id);
    }

    return result;
  }
```

Also update the appointment update controller at `apps/api/src/modules/appointments/appointments.controller.ts` to pass the user's role:

```typescript
// In the updateAppointmentController, pass the user's role for cancellation context
const { id: userId, role } = request.user as { id: string; role: string };
const appointment = await appointmentsService.updateStatus(request.params.id, request.body.status, role);
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/payments/ apps/api/src/app.ts apps/api/src/modules/appointments/appointments.service.ts apps/api/src/workers/notification.worker.ts
git commit -m "feat: add payment system — VNPay/MoMo gateways, 3-tier refund, expiry handling"
```

---

## Chunk 4: Payment Frontend + Notification Preferences

### Task 11: Create payment frontend pages and components

**Files:**
- Create: `apps/web/components/payments/payment-button.tsx`
- Create: `apps/web/components/payments/payment-history.tsx`
- Create: `apps/web/app/(dashboard)/patient/payments/page.tsx`
- Create: `apps/web/app/payment/result/page.tsx`
- Modify: `apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx`

- [ ] **Step 1: Create PaymentButton component**

Create `apps/web/components/payments/payment-button.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface PaymentButtonProps {
  appointmentId: string;
  amount: number;
}

export function PaymentButton({ appointmentId, amount }: PaymentButtonProps) {
  const { token } = useAuthStore();
  const [method, setMethod] = useState<"VNPAY" | "MOMO">("VNPAY");
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const result = await api<{ paymentUrl: string }>(`/api/payments/${appointmentId}/create`, {
        method: "POST",
        token,
        body: JSON.stringify({ method }),
      });
      window.location.href = result.paymentUrl;
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={method} onValueChange={(v) => setMethod(v as "VNPAY" | "MOMO")}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VNPAY">VNPay</SelectItem>
          <SelectItem value="MOMO">MoMo</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handlePay} disabled={loading}>
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? "Đang xử lý..." : `Thanh toán ${amount?.toLocaleString("vi-VN")}đ`}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create PaymentHistory component**

Create `apps/web/components/payments/payment-history.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Đang chờ", variant: "secondary" },
  PAID: { label: "Đã thanh toán", variant: "default" },
  FAILED: { label: "Thất bại", variant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "outline" },
  EXPIRED: { label: "Hết hạn", variant: "secondary" },
};

export function PaymentHistory() {
  const { token } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<any[]>("/api/payments/history", { token })
      .then(setPayments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton className="h-48 rounded-lg" />;

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">Chưa có giao dịch nào.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const status = STATUS_MAP[p.status] || { label: p.status, variant: "secondary" as const };
        return (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.appointment?.doctor?.user?.fullName || "Bác sĩ"}</p>
                <p className="text-sm text-gray-500">
                  {new Date(p.appointment?.date).toLocaleDateString("vi-VN")} · {p.appointment?.timeSlot}
                </p>
                <p className="text-sm text-gray-500">{p.method}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{p.amount?.toLocaleString("vi-VN")}đ</p>
                <Badge variant={status.variant}>{status.label}</Badge>
                {p.refundAmount && (
                  <p className="text-xs text-gray-500 mt-1">Hoàn: {p.refundAmount.toLocaleString("vi-VN")}đ</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create patient payments page**

Create `apps/web/app/(dashboard)/patient/payments/page.tsx`:
```tsx
import { PaymentHistory } from "@/components/payments/payment-history";

export default function PatientPaymentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lịch sử thanh toán</h1>
      <PaymentHistory />
    </div>
  );
}
```

- [ ] **Step 4: Create payment result page (standalone)**

Create `apps/web/app/payment/result/page.tsx`:
```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const ref = searchParams.get("ref");
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isSuccess ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle>{isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {isSuccess
              ? "Giao dịch đã được xử lý thành công."
              : "Giao dịch không thành công. Vui lòng thử lại."}
          </p>
          {ref && <p className="text-sm text-gray-400">Mã giao dịch: {ref}</p>}
          <div className="flex gap-3 justify-center">
            <Link href="/patient/dashboard">
              <Button variant={isSuccess ? "default" : "outline"}>Về trang chủ</Button>
            </Link>
            {!isSuccess && (
              <Link href="/patient/appointments">
                <Button>Thử lại</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
```

- [ ] **Step 5: Add payment button to appointment detail page**

In `apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx`, add the PaymentButton component for UNPAID non-CASH appointments:

```tsx
import { PaymentButton } from "@/components/payments/payment-button";
```

After the appointment status section, render:
```tsx
{appointment?.paymentStatus === "UNPAID" && appointment?.paymentMethod !== "CASH" && appointment?.status !== "CANCELLED" && (
  <div className="mt-4">
    <PaymentButton appointmentId={id} amount={appointment.amount || 0} />
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/payments/ apps/web/app/(dashboard)/patient/payments/ apps/web/app/payment/ apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx
git commit -m "feat: add payment UI — payment button, history page, result page"
```

---

### Task 12: Add notification preferences API and UI

**Files:**
- Create: `apps/api/src/modules/notifications/preferences.controller.ts`
- Modify: `apps/api/src/modules/notifications/notifications.routes.ts`
- Create: `apps/web/components/notifications/notification-preferences.tsx`
- Create: `apps/web/app/(dashboard)/settings/notifications/page.tsx`

- [ ] **Step 1: Create preferences controller**

Create `apps/api/src/modules/notifications/preferences.controller.ts`:
```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { success } from "../../lib/response";

export async function getPreferencesController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    let prefs = await prisma.notificationPreference.findUnique({ where: { userId: id } });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: id },
      });
    }
    reply.send(success(prefs));
  } catch (err: any) {
    reply.status(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
}

export async function updatePreferencesController(
  request: FastifyRequest<{ Body: { email?: boolean; sms?: boolean; inApp?: boolean } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.user as { id: string };
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: id },
      update: request.body,
      create: { userId: id, ...request.body },
    });
    reply.send(success(prefs));
  } catch (err: any) {
    reply.status(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
}
```

- [ ] **Step 2: Add preference routes**

Modify `apps/api/src/modules/notifications/notifications.routes.ts` — add:

```typescript
import { getPreferencesController, updatePreferencesController } from "./preferences.controller";
```

Add routes:
```typescript
  app.get("/api/notifications/preferences", { preHandler: [authenticate] }, getPreferencesController);
  app.put<{ Body: { email?: boolean; sms?: boolean; inApp?: boolean } }>("/api/notifications/preferences", { preHandler: [authenticate] }, updatePreferencesController);
```

- [ ] **Step 3: Create NotificationPreferences component**

Create `apps/web/components/notifications/notification-preferences.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { Bell, Mail, Smartphone } from "lucide-react";

interface Prefs {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export function NotificationPreferences() {
  const { token } = useAuthStore();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<Prefs>("/api/notifications/preferences", { token })
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function toggle(key: keyof Prefs) {
    if (!prefs || !token) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await api("/api/notifications/preferences", {
        method: "PUT",
        token,
        body: JSON.stringify({ [key]: updated[key] }),
      });
      toast.success("Đã cập nhật");
    } catch {
      setPrefs(prefs); // revert
      toast.error("Cập nhật thất bại");
    }
  }

  if (loading) return <Skeleton className="h-48 rounded-lg" />;
  if (!prefs) return null;

  const channels = [
    { key: "inApp" as const, label: "Thông báo trong ứng dụng", icon: Bell },
    { key: "email" as const, label: "Email", icon: Mail },
    { key: "sms" as const, label: "SMS", icon: Smartphone },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt thông báo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-gray-500" />
              <Label>{label}</Label>
            </div>
            <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create notification settings page**

Create `apps/web/app/(dashboard)/settings/notifications/page.tsx`:
```tsx
import { NotificationPreferences } from "@/components/notifications/notification-preferences";

export default function NotificationSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cài đặt thông báo</h1>
      <NotificationPreferences />
    </div>
  );
}
```

- [ ] **Step 5: Add navigation links for new pages**

Update the dashboard sidebar/navigation to include links to:
- `/patient/payments` — "Lịch sử thanh toán"
- `/settings/notifications` — "Cài đặt thông báo"

Check the current dashboard layout at `apps/web/components/layout/dashboard-layout.tsx` and add the new menu items.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/notifications/ apps/web/components/notifications/ apps/web/app/(dashboard)/settings/ apps/web/app/(dashboard)/patient/payments/ apps/web/components/layout/dashboard-layout.tsx
git commit -m "feat: add notification preferences API and UI, payment history navigation"
```

---

## Chunk 5: Integration, Testing, and Polish

### Task 13: Wire up appointment notifications with reminders

**Files:**
- Modify: `apps/api/src/modules/appointments/appointments.service.ts`

- [ ] **Step 1: Add notification dispatching to appointment lifecycle**

In `apps/api/src/modules/appointments/appointments.service.ts`, after creating an appointment in the `create` method, add notification + reminder scheduling:

```typescript
import { notify, scheduleReminder } from "../../lib/notify";
```

Refactor the `create` method: change `return prisma.$transaction(...)` to `const created = await prisma.$transaction(...)` so notification code runs after the transaction. Also update the `include` clause inside the transaction to select `doctor.userId`:

```typescript
// Change: include doctor userId in the create query
include: {
  doctor: { include: { user: { select: { id: true, fullName: true } }, specialty: true } },
  clinic: { select: { name: true, address: true } },
},
```

Then after the transaction:

```typescript
// After the transaction, dispatch notifications
// (The method now does: const created = await prisma.$transaction(...); then notifications; then return created;)

// Notify doctor about new appointment
await notify({
  userId: created.doctor.user.id, // Note: user.id not doctor.userId — matches the select clause
  type: "APPOINTMENT_CREATED",
  title: "Lịch hẹn mới",
  content: `Bệnh nhân đặt lịch hẹn ngày ${input.date} lúc ${input.timeSlot}`,
  channels: ["IN_APP", "EMAIL"],
});

// Notify patient
await notify({
  userId: patientId,
  type: "APPOINTMENT_CREATED",
  title: "Đặt lịch thành công",
  content: `Lịch hẹn với ${created.doctor.user.fullName} ngày ${input.date} lúc ${input.timeSlot}`,
  channels: ["IN_APP", "EMAIL"],
});

return created;
```

In the `updateStatus` method, add notifications for status changes and schedule reminders on CONFIRMED:

```typescript
if (status === "CONFIRMED") {
  // Schedule reminders
  const appointmentDate = new Date(result.date);
  const [h, m] = result.timeSlot.split(":").map(Number);
  appointmentDate.setHours(h, m, 0, 0);

  await scheduleReminder(
    id,
    result.patientId,
    result.doctor.user.fullName,
    result.date.toISOString().split("T")[0],
    result.timeSlot,
    appointmentDate
  );

  await notify({
    userId: result.patientId,
    type: "APPOINTMENT_CONFIRMED",
    title: "Lịch hẹn đã xác nhận",
    content: `Lịch hẹn với ${result.doctor.user.fullName} đã được xác nhận`,
    channels: ["IN_APP", "EMAIL", "SMS"],
  });
}

if (status === "CANCELLED") {
  // existing refund + cancelReminders code
  await notify({
    userId: result.patientId,
    type: "APPOINTMENT_CANCELLED",
    title: "Lịch hẹn đã hủy",
    content: `Lịch hẹn đã bị hủy`,
    channels: ["IN_APP", "EMAIL"],
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/appointments/appointments.service.ts
git commit -m "feat: wire up appointment notifications and reminder scheduling"
```

---

### Task 14: Add payment status badges to appointment cards

**Files:**
- Modify: `apps/web/components/appointments/appointment-card.tsx`

- [ ] **Step 1: Add payment status badge**

In `apps/web/components/appointments/appointment-card.tsx`, add a payment status badge next to the appointment status. Add:

```tsx
const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  UNPAID: { label: "Chưa thanh toán", className: "bg-orange-100 text-orange-700" },
  PAID: { label: "Đã thanh toán", className: "bg-green-100 text-green-700" },
  REFUNDED: { label: "Đã hoàn tiền", className: "bg-blue-100 text-blue-700" },
};
```

After the status badge, add:
```tsx
{appointment.paymentStatus && appointment.paymentStatus !== "UNPAID" && (
  <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_STATUS[appointment.paymentStatus]?.className || ""}`}>
    {PAYMENT_STATUS[appointment.paymentStatus]?.label || appointment.paymentStatus}
  </span>
)}
```

Also show amount if present:
```tsx
{appointment.amount && (
  <span className="text-sm text-gray-500">{appointment.amount.toLocaleString("vi-VN")}đ</span>
)}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/appointments/appointment-card.tsx
git commit -m "feat: add payment status badges to appointment cards"
```

---

### Task 15: Update environment and Docker configuration

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Verify Docker Compose has Redis and all env vars**

Ensure `docker-compose.yml` has:
- Redis service with healthcheck
- `REDIS_URL` in API service environment
- API `depends_on` includes `redis` with `condition: service_healthy`
- `redisdata` in volumes

- [ ] **Step 2: Verify .env.example is complete**

Ensure all Phase 2 env vars are listed.

- [ ] **Step 3: Commit if changes needed**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: update Docker and env config for Phase 2"
```

---

### Task 16: Final integration test and commit

- [ ] **Step 1: Run TypeScript compilation check**

```bash
cd apps/api && npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Run existing tests**

```bash
cd apps/api && npm test
```

Fix any failures.

- [ ] **Step 3: Test frontend build**

```bash
cd apps/web && npm run build
```

Fix any build errors.

- [ ] **Step 4: Final commit with any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues for Phase 2 integration"
```

- [ ] **Step 5: Summary commit for Phase 2**

If all clean, tag the milestone:

```bash
git log --oneline feat/phase1-mvp..HEAD
```

Review all Phase 2 commits are in order.
