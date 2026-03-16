# BCare Phase 2 — Payment + Reviews Design Spec

**Date:** 2026-03-16
**Phase:** 2 of 4
**Branch:** `feat/phase2-payment-reviews`
**Depends on:** Phase 1 MVP (complete on `feat/phase1-mvp`)

---

## Overview

Phase 2 adds payment processing (VNPay + MoMo sandbox), doctor review system, and multi-channel notifications (email via Resend, SMS via eSMS.vn) powered by BullMQ job queue with Redis.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment gateway | VNPay + MoMo sandbox | Production-ready flow, switch to live keys later |
| Payment flow | Booking first, pay later | Patient books → pays before appointment time |
| Refund policy | Auto refund if cancelled ≥24h before appointment | Via gateway refund API |
| Review timing | Only after COMPLETED appointment | Ensures quality, prevents spam |
| Review editing | Editable within 7 days, no delete | Balance between flexibility and integrity |
| Notification channels | In-app + Email (Resend) + SMS (eSMS.vn) | Full coverage per spec |
| Job queue | BullMQ + Redis | Reliable delayed jobs, retry, non-blocking |
| Architecture | Queue-driven notifications | All notifications go through BullMQ worker |

---

## 1. Database Schema Changes

### New: `Payment` model

```prisma
model Payment {
  id            String        @id @default(cuid())
  appointmentId String        @unique
  userId        String
  amount        Int           // VND
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  transactionId String?       // Gateway transaction ID
  gatewayData   Json?         // Raw gateway response
  refundedAt    DateTime?
  refundReason  String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  appointment   Appointment   @relation(fields: [appointmentId], references: [id])
  user          User          @relation(fields: [userId], references: [id])

  @@map("payments")
}
```

### Modified: `PaymentStatus` enum

```prisma
enum PaymentStatus {
  PENDING   // Payment created, awaiting gateway
  UNPAID    // Not yet paid (appointment default)
  PAID
  REFUNDED
  FAILED
}
```

### Modified: `Review` model

Add `updatedAt` field:

```prisma
model Review {
  // ... existing fields
  updatedAt DateTime @updatedAt
}
```

### New: `NotificationPreference` model

```prisma
model NotificationPreference {
  id     String  @id @default(cuid())
  userId String  @unique
  email  Boolean @default(true)
  sms    Boolean @default(true)
  inApp  Boolean @default(true)

  user   User    @relation(fields: [userId], references: [id])

  @@map("notification_preferences")
}
```

### Modified: `Notification` model

Add fields:

```prisma
model Notification {
  // ... existing fields
  channel String?   // "IN_APP", "EMAIL", "SMS"
  sentAt  DateTime?
}
```

### Modified: `NotificationType` enum

Add new types:

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

### Relations

Add to `User` model:
```prisma
payments                User[] // relation
notificationPreference  NotificationPreference?
```

Add to `Appointment` model:
```prisma
payment Payment?
```

---

## 2. Payment Flow

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/:appointmentId/create` | Patient | Create payment, return gateway redirect URL |
| GET | `/api/payments/vnpay/callback` | Public | VNPay return URL (redirect after payment) |
| GET | `/api/payments/momo/callback` | Public | MoMo return URL |
| POST | `/api/payments/vnpay/ipn` | Public | VNPay IPN webhook (server-to-server) |
| POST | `/api/payments/momo/ipn` | Public | MoMo IPN webhook |
| GET | `/api/payments/history` | Patient | Payment history with pagination |
| GET | `/api/payments/:id` | Patient | Payment detail |
| POST | `/api/payments/:id/refund` | System | Trigger refund (called internally on cancel) |

### Payment Creation Flow

```
1. Patient clicks "Thanh toán" on UNPAID appointment
2. POST /api/payments/:appointmentId/create { method: "VNPAY" | "MOMO" }
3. Server:
   a. Validate appointment belongs to patient, status not CANCELLED
   b. Validate no existing PAID payment for this appointment
   c. Create Payment record (status: PENDING)
   d. Call VNPay/MoMo sandbox API to create payment URL
   e. Return { paymentUrl: "https://sandbox.vnpay.vn/..." }
4. Frontend redirects to paymentUrl
5. Patient completes payment on gateway
6. Gateway redirects to /payments/{gateway}/callback → show result page
7. Gateway calls IPN webhook (server-to-server):
   a. Verify signature/checksum
   b. Update Payment status → PAID
   c. Update Appointment paymentStatus → PAID
   d. Enqueue notification job (in-app + email + SMS)
```

### Refund Flow

```
1. Patient cancels appointment (appointment.date - now >= 24h)
2. System checks: Payment exists with status PAID?
3. If yes:
   a. Call gateway refund API (VNPay/MoMo)
   b. Update Payment status → REFUNDED, set refundedAt
   c. Update Appointment paymentStatus → REFUNDED
   d. Enqueue notification job
4. If cancelling < 24h before appointment: no refund, notify patient
```

### VNPay Sandbox Integration

- Sandbox URL: `https://sandbox.vnpay.vn/paymentv2/vpcpay.html`
- Parameters: vnp_TmnCode, vnp_Amount, vnp_OrderInfo, vnp_ReturnUrl, vnp_IpnUrl
- Signature: HMAC-SHA512 with secret key
- Test cards provided by VNPay sandbox

### MoMo Sandbox Integration

- Sandbox URL: `https://test-payment.momo.vn/v2/gateway/api/create`
- Parameters: partnerCode, requestId, amount, orderInfo, redirectUrl, ipnUrl
- Signature: HMAC-SHA256
- Test wallet provided by MoMo sandbox

### Security

- IPN webhooks verify gateway signature before processing
- Client callback is display-only; actual payment status updated via IPN
- Payment creation only allowed for own appointments
- Idempotent IPN handling (check if already processed)

---

## 3. Review System

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reviews` | Patient | Create review for completed appointment |
| PUT | `/api/reviews/:id` | Patient | Edit review (within 7 days) |
| GET | `/api/reviews/my` | Patient | List patient's own reviews |
| GET | `/api/doctors/:id/reviews` | Public | Already exists from Phase 1 |

### Validation Schema

```typescript
const createReviewSchema = z.object({
  appointmentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
});
```

### Business Rules

1. **Create**: appointment.status must be COMPLETED, no existing review for this appointment
2. **Edit**: only within 7 days of createdAt, only by the review author
3. **No delete**: reviews cannot be deleted
4. **Rating update**: after create/edit, recalculate doctor.rating as average of all reviews
5. **Notification**: on create, push notification to doctor via BullMQ

### Frontend Components

- **Review form**: 5-star interactive rating + textarea (max 500 chars)
- **Location**: embedded in `/patient/appointments/[id]` page when status is COMPLETED
- **States**: no review → show form, has review (< 7 days) → show review + edit button, has review (≥ 7 days) → show review only

---

## 4. Notification System (Queue-driven)

### Architecture

```
Service Layer → enqueue job → BullMQ Queue → Worker Process
                                                ├─ In-app handler (insert Notification DB)
                                                ├─ Email handler (Resend API)
                                                └─ SMS handler (eSMS.vn API)
```

### BullMQ Queues

| Queue | Purpose | Retry |
|-------|---------|-------|
| `notification` | Immediate notifications | 3 attempts, exponential backoff (1s, 5s, 30s) |
| `reminder` | Delayed appointment reminders | 3 attempts, exponential backoff |

### Job Data Structure

```typescript
interface NotificationJob {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  channels: ("IN_APP" | "EMAIL" | "SMS")[];
  metadata?: Record<string, any>; // appointmentId, paymentId, etc.
}

interface ReminderJob {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reminderType: "24H" | "30M";
}
```

### Notification Matrix

| Event | In-app | Email | SMS |
|-------|--------|-------|-----|
| Appointment created | Patient + Doctor | Patient | — |
| Appointment confirmed | Patient | Patient | Patient |
| Appointment cancelled | Both | Both | — |
| Payment success | Patient | Patient | Patient |
| Payment failed | Patient | Patient | — |
| Refund processed | Patient | Patient | — |
| Review received | Doctor | Doctor | — |
| Reminder 24h | Patient | Patient | Patient |
| Reminder 30min | Patient | — | Patient |

### Reminder Scheduling

```
On appointment confirmed:
  1. Calculate delay_24h = appointmentDateTime - 24 hours - now
  2. Calculate delay_30m = appointmentDateTime - 30 minutes - now
  3. Add delayed job to reminder queue with respective delays
  4. Store BullMQ job IDs on appointment metadata for cancellation

On appointment cancelled:
  1. Remove delayed reminder jobs by stored job IDs
```

### Notification Preferences

Each user has a `NotificationPreference` record. Worker checks preferences before sending each channel. Default: all channels enabled.

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/preferences` | User | Get notification preferences |
| PUT | `/api/notifications/preferences` | User | Update preferences |

### Email (Resend)

- Provider: Resend (resend.com)
- Templates: simple HTML templates for each notification type
- From address: `noreply@bcare.vn` (or configured domain)
- Sandbox: Resend provides free tier (100 emails/day)

### SMS (eSMS.vn)

- Provider: eSMS.vn API
- Endpoint: `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json`
- Parameters: Phone, Content, ApiKey, SecretKey, SmsType
- Sandbox: test mode with eSMS sandbox credentials

---

## 5. New Dependencies

```json
{
  "dependencies": {
    "bullmq": "^5.0.0",
    "ioredis": "^5.4.0",
    "resend": "^4.0.0"
  }
}
```

Redis connection: via `REDIS_URL` environment variable (default: `redis://localhost:6379`).

---

## 6. Frontend Pages & Components

### New Pages

| Page | Description |
|------|-------------|
| `/patient/payments` | Payment history list |
| `/payment/result` | Payment result page (success/failure after gateway redirect) |

### Modified Pages

| Page | Changes |
|------|---------|
| `/patient/appointments/[id]` | Add "Thanh toán" button (UNPAID), review form (COMPLETED) |
| `/patient/dashboard` | Show payment status badges on appointment cards |
| `/settings/notifications` | Notification preferences toggle (email/SMS/in-app) |

### New Components

| Component | Description |
|-----------|-------------|
| `PaymentButton` | Initiates payment flow, shows loading, redirects |
| `PaymentHistory` | List of payments with status badges |
| `PaymentResult` | Success/failure display after gateway redirect |
| `ReviewForm` | 5-star rating + comment textarea |
| `ReviewDisplay` | Show existing review with edit button if eligible |
| `NotificationPreferences` | Toggle switches for each channel |

---

## 7. Environment Variables

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

---

## 8. Docker Changes

Add Redis service to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: bcare-redis
  ports:
    - "6379:6379"
  volumes:
    - redisdata:/data
```

API service adds `REDIS_URL` env var and `depends_on: redis`.

Optional: add BullMQ dashboard (bull-board) for monitoring queues in development.
