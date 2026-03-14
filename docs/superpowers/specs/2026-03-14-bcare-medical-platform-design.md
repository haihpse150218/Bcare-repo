# BCare — Medical Appointment Booking Platform

## Overview

A modern medical appointment booking platform connecting patients with doctors, clinics, and hospitals in Vietnam. Inspired by bcare.vn with a clean, minimalist design inspired by Singapore hospital aesthetics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS + shadcn/ui |
| Backend API | Node.js + Fastify |
| Database | Supabase PostgreSQL + Prisma ORM |
| Realtime | Fastify WebSocket (all realtime via backend) |
| Video Call | Agora.io SDK |
| Storage | Supabase Storage |
| Payment | VNPay + Momo |
| Email | Resend |
| SMS | eSMS.vn |
| Job Queue | BullMQ + Redis (Upstash) |
| Monorepo | Turborepo |
| Deploy FE | Vercel |
| Deploy BE | Railway / Render |

## Architecture

Separated frontend + backend API in a Turborepo monorepo.

```
CLIENT (Next.js on Vercel)
  │ REST API + WebSocket
  ▼
BACKEND API (Fastify on Railway/Render)
  │
  ▼
DATA LAYER
  ├── Supabase PostgreSQL (Prisma ORM)
  ├── Supabase Storage (files, images)
  ├── Redis/Upstash (sessions, cache, job queue)
  └── Agora SDK (video call - P2P)
```

### Monorepo Structure

```
bcare/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── shared/       # Types, constants, validation schemas (Zod)
│   └── db/           # Prisma schema + migrations
├── turbo.json
└── package.json
```

## User Roles

| Role | Description |
|------|------------|
| Patient | Search doctors, book appointments, chat, video call, pay online |
| Doctor | Manage schedule, view/confirm appointments, chat with patients |
| Clinic/Hospital | Manage doctors, staff, view all appointments |
| Staff | Reception, manage appointments on behalf of clinic |
| Admin | System-wide management, reports, blog CMS |

## Database Schema

### Core Tables

**users**
- id, email, phone, password_hash, full_name, avatar_url, role (enum), is_verified, created_at, updated_at

**doctors**
- id, user_id (FK), clinic_id (FK), specialty_id (FK), slug (unique), title, bio, experience_years, consultation_fee, rating_avg, is_available, verification_status (enum)

**clinics**
- id, user_id (FK), name, slug (unique), address, district, city, lat, lng, phone, description, images[], operating_hours, verification_status (enum)

**specialties**
- id, name, slug, icon, description

**schedules**
- id, doctor_id (FK), day_of_week, start_time, end_time, slot_duration, is_active

**appointments**
- id, patient_id (FK), doctor_id (FK), clinic_id (FK), schedule_id (FK), date, time_slot, status (enum), symptom_note, payment_status, payment_method, amount, created_at
- UNIQUE constraint on (doctor_id, date, time_slot) to prevent double-booking
- Booking uses SELECT ... FOR UPDATE in transaction for concurrency safety

**medical_records**
- id, patient_id (FK), doctor_id (FK), appointment_id (FK), diagnosis, prescription, notes, attachments[], created_at, updated_at

**reviews**
- id, patient_id (FK), doctor_id (FK), appointment_id (FK), rating (1-5), comment, created_at

**payments**
- id, appointment_id (FK), amount, method (enum), transaction_id, status (enum), paid_at

**conversations**
- id, appointment_id (FK, nullable), patient_id (FK), doctor_id (FK), created_at

**messages**
- id, conversation_id (FK), sender_id (FK), content, type (enum), file_url, created_at

**notifications**
- id, user_id (FK), title, content, type (enum), is_read, created_at

**staff**
- id, user_id (FK), clinic_id (FK), position, permissions[]

**blog_posts**
- id, author_id (FK), title, slug, content, thumbnail_url, category_id (FK), meta_description, meta_image, is_published, created_at, updated_at

**blog_categories**
- id, name, slug

**blog_tags**
- id, name, slug

**blog_post_tags** (many-to-many)
- post_id (FK), tag_id (FK)

**audit_logs**
- id, user_id (FK), action, resource_type, resource_id, ip_address, metadata (jsonb), created_at

### Enums

- `role`: PATIENT, DOCTOR, CLINIC, STAFF, ADMIN
- `appointment_status`: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- `payment_status`: UNPAID, PAID, REFUNDED
- `payment_method`: VNPAY, MOMO, CASH
- `message_type`: TEXT, IMAGE, FILE, VIDEO_CALL
- `verification_status`: PENDING, VERIFIED, REJECTED

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-phone
GET    /api/auth/me
```

### Doctors & Clinics
```
GET    /api/doctors
GET    /api/doctors/:id
GET    /api/doctors/:id/schedules
GET    /api/doctors/:id/reviews
GET    /api/clinics
GET    /api/clinics/:id
GET    /api/clinics/:id/doctors
GET    /api/specialties
```

### Booking
```
POST   /api/appointments
GET    /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id
```

### Payment
```
POST   /api/payments/vnpay/create
GET    /api/payments/vnpay/return      # User redirect back
GET    /api/payments/vnpay/ipn         # Server-to-server IPN
POST   /api/payments/momo/create
POST   /api/payments/momo/ipn          # Momo IPN (POST)
GET    /api/payments/momo/return       # User redirect back
GET    /api/payments/:id
POST   /api/payments/:id/refund        # Refund flow
```

### Chat & Telemedicine
```
WebSocket /ws/chat
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
POST   /api/video-call/token
```

### Notifications
```
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

### Blog
```
GET    /api/posts
GET    /api/posts/:slug
POST   /api/posts
PATCH  /api/posts/:id
DELETE /api/posts/:id
```

### Medical Records
```
GET    /api/medical-records            # Patient's records
POST   /api/medical-records            # Doctor creates record
GET    /api/medical-records/:id
PATCH  /api/medical-records/:id
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/users
PATCH  /api/admin/users/:id
GET    /api/admin/appointments
GET    /api/admin/payments
GET    /api/admin/reports
GET    /api/admin/specialties
POST   /api/admin/specialties
PATCH  /api/admin/specialties/:id
DELETE /api/admin/specialties/:id
GET    /api/admin/settings
PATCH  /api/admin/settings
PATCH  /api/admin/doctors/:id/verify   # Verify doctor
PATCH  /api/admin/clinics/:id/verify   # Verify clinic
```

### Doctor/Clinic Dashboard
```
PUT    /api/doctors/profile
GET    /api/doctors/patients            # Doctor's patient list
POST   /api/doctors/schedules           # Create schedule entry
PUT    /api/doctors/schedules/:id       # Update schedule entry
DELETE /api/doctors/schedules/:id       # Delete schedule entry
PUT    /api/clinics/profile
POST   /api/clinics/staff
DELETE /api/clinics/staff/:id
```

### Upload
```
POST   /api/upload/image
POST   /api/upload/file
```

### Query Parameters (all list endpoints)
- `page` (default: 1), `limit` (default: 20, max: 100)
- `sort` (field name), `order` (asc/desc)
- Endpoint-specific filters: `specialty`, `city`, `status`, `date_from`, `date_to`

### Middleware
- `authenticate` — Verify JWT token
- `authorize(roles[])` — Role-based access control
- `rateLimit` — Auth: 5 req/min per IP; Booking: 10 req/min per user; General: 100 req/min per user
- `validate(schema)` — Input validation with Zod
- `auditLog` — Log PHI access to audit_logs table

## Frontend Pages

### Public
- `/` — Homepage (hero, search, specialties, top doctors, clinics, how it works, blog)
- `/doctors` — Doctor search with filters
- `/doctors/:slug` — Doctor detail + booking
- `/clinics` — Clinic listing
- `/clinics/:slug` — Clinic detail
- `/specialties` — Specialty listing
- `/specialties/:slug` — Doctors by specialty
- `/blog` — Health blog
- `/blog/:slug` — Blog post
- `/login`, `/register`, `/forgot-password` — Auth pages

### Patient Dashboard
- `/patient/dashboard` — Overview
- `/patient/appointments` — My appointments
- `/patient/appointments/:id` — Appointment detail
- `/patient/messages` — Chat list
- `/patient/messages/:id` — Conversation
- `/patient/medical-records` — Medical records
- `/patient/profile` — Profile settings
- `/patient/notifications` — Notifications

### Doctor Dashboard
- `/doctor/dashboard` — Today's schedule, stats
- `/doctor/appointments` — Manage appointments
- `/doctor/schedule` — Configure working hours
- `/doctor/messages` — Chat with patients
- `/doctor/patients` — Patient list
- `/doctor/reviews` — Reviews
- `/doctor/profile` — Doctor profile

### Clinic Dashboard
- `/clinic/dashboard` — Clinic overview
- `/clinic/doctors` — Manage doctors
- `/clinic/staff` — Manage staff
- `/clinic/appointments` — All appointments
- `/clinic/profile` — Clinic profile

### Staff Dashboard
- `/staff/dashboard` — Overview
- `/staff/appointments` — Manage appointments
- `/staff/patients` — Patient reception

### Admin Dashboard
- `/admin/dashboard` — System stats
- `/admin/users` — User management
- `/admin/clinics` — Clinic management
- `/admin/doctors` — Doctor management
- `/admin/appointments` — All appointments
- `/admin/payments` — Payment management
- `/admin/blog` — Blog CMS
- `/admin/specialties` — Specialty management
- `/admin/settings` — System settings

## Design System

### Color Palette
```
Primary:     #0066CC  (trust, medical blue)
Secondary:   #E8F4FD  (light blue background)
Accent:      #00A86B  (success, available green)
Neutral:     #F8FAFB  (page background)
Text:        #1A1A2E  (primary text)
Text Light:  #6B7280  (secondary text)
Border:      #E5E7EB  (subtle borders)
White:       #FFFFFF  (cards, surfaces)
Danger:      #DC2626  (errors, cancel)
```

### Typography
- Font: Inter
- H1: 36px / bold
- H2: 28px / semibold
- H3: 22px / semibold
- Body: 16px / regular
- Small: 14px / regular

### Design Principles
- Clean, minimalist, Singapore hospital aesthetic
- Generous whitespace (24-48px between sections)
- Soft border radius (8-12px)
- Subtle shadows (`0 1px 3px rgba(0,0,0,0.08)`)
- Card-based layouts
- Lucide Icons (line style)
- Circular doctor avatars with subtle borders
- No complex gradients — flat and clean
- Mobile-first responsive design

## Compliance & Data Protection

- **Vietnamese Data Law**: Comply with Decree 13/2023/ND-CP on personal data protection
- **Supabase Region**: Southeast Asia (Singapore) for data residency compliance
- **Encryption**: All data encrypted at rest (Supabase default) + TLS in transit
- **Audit Logging**: All PHI access logged to `audit_logs` table (who accessed what, when, from where)
- **Consent Management**: Users must consent to data collection during registration
- **Data Retention**: Medical records retained per Vietnamese healthcare law; users can request data export/deletion for non-medical data
- **Password Security**: bcrypt hashing with salt rounds >= 12

## Cancellation & Refund Policy

- **Patient cancels > 24h before**: Full refund
- **Patient cancels 2-24h before**: 50% refund
- **Patient cancels < 2h before**: No refund
- **Doctor/Clinic cancels**: Always full refund
- **Refund flow**: PATCH appointment status to CANCELLED → system checks policy → auto-creates refund via VNPay/Momo API → updates payment_status to REFUNDED
- **Cash payments**: No refund processing needed

## i18n Strategy

- Primary language: Vietnamese (vi)
- Secondary language: English (en) — future phase
- Library: `next-intl` for frontend
- Date/time: Vietnamese locale formatting (dd/MM/yyyy, HH:mm)
- Currency: VND formatting (e.g., 500.000 VND)
- Backend API responses: language-agnostic (codes + data), frontend handles display text

## Realtime Features

### Chat
- All WebSocket connections routed through Fastify backend (single realtime layer)
- Messages persisted to PostgreSQL
- File/image upload via Supabase Storage
- Typing indicator + online status via WebSocket presence events

### Video Call (Agora)
- Doctor initiates call → API generates Agora token
- Patient receives notification → accepts call
- Both join Agora channel (channel = appointment_id)
- P2P video/audio
- Call duration logged to appointment record

### Notifications
- In-app: WebSocket push via Fastify
- Email: Resend (appointment confirmation, reminders)
- SMS: eSMS.vn (OTP, appointment reminders)
- BullMQ job queue for async processing
- Auto-retry (max 3 attempts)
- Cron: reminders at 24h and 30min before appointment

## Payment Integration

### VNPay
- API creates VNPay payment URL → redirect patient
- VNPay IPN callback → verify checksum → update payment status
- Redirect patient to result page

### Momo
- API creates Momo payment request (API v2) → redirect/deeplink
- Momo callback → verify signature → update payment status
- Redirect patient to result page

## Implementation Phases

### Phase 1 — MVP Core (Foundation + Booking)
- Monorepo setup (Turborepo + Next.js + Fastify + Prisma)
- Auth system (register, login, JWT, OTP phone verification)
- Database schema + seed data
- Homepage (hero, search, specialties, top doctors)
- Doctor search (filter by specialty, area, rating)
- Doctor detail page (profile, available slots, reviews)
- Clinic detail page
- Appointment booking (date/time picker, confirmation)
- Patient dashboard (appointments list, cancel)
- Doctor dashboard (view appointments, confirm/cancel, schedule settings)
- Staff dashboard (reception, appointment management)
- Basic in-app notifications
- Responsive design (mobile-first)

### Phase 2 — Payment + Reviews
- VNPay integration
- Momo integration
- Payment page + result page
- Doctor review system (post-appointment)
- Email notifications (Resend)
- SMS notifications (eSMS.vn)
- BullMQ job queue for async notifications
- Cron job for appointment reminders (30min, 24h)
- Payment history for patient + admin

### Phase 3 — Telemedicine + Chat
- Realtime chat (WebSocket + Supabase Realtime)
- File/image upload in chat (Supabase Storage)
- Typing indicator + online status
- Video call (Agora SDK)
- Video call UI (incoming call, in-call controls)
- Patient medical records
- Clinic dashboard (manage doctors, staff)

### Phase 4 — Admin + Blog + Polish
- Full admin dashboard (stats, revenue charts)
- User/doctor/clinic management (verify, ban)
- Blog CMS (create, edit, delete posts)
- Public blog (listing, detail, SEO)
- Revenue reports (Recharts)
- SEO optimization (meta tags, sitemap, structured data)
- Performance optimization (image optimization, caching)
- Security hardening (rate limit, CORS, input sanitization)
- Error tracking (Sentry)

## Directory Structure

```
bcare/
├── apps/
│   ├── web/                      # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (public)/         # Public pages (SSR)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── doctors/
│   │   │   │   ├── clinics/
│   │   │   │   ├── specialties/
│   │   │   │   └── blog/
│   │   │   ├── (auth)/           # Auth pages
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── (dashboard)/      # Authenticated pages
│   │   │   │   ├── patient/
│   │   │   │   ├── doctor/
│   │   │   │   ├── clinic/
│   │   │   │   ├── staff/
│   │   │   │   └── admin/
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui
│   │   │   ├── layout/           # Header, Footer, Sidebar
│   │   │   ├── doctors/          # DoctorCard, DoctorList
│   │   │   ├── booking/          # BookingModal, Calendar
│   │   │   ├── chat/             # ChatWindow, MessageBubble
│   │   │   └── shared/           # SearchBar, Rating
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   ├── auth.ts           # Auth helpers
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── stores/               # Zustand
│   │   └── types/
│   │
│   └── api/                      # Fastify Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.schema.ts
│       │   │   │   └── auth.routes.ts
│       │   │   ├── doctors/
│       │   │   ├── clinics/
│       │   │   ├── appointments/
│       │   │   ├── payments/
│       │   │   ├── chat/
│       │   │   ├── notifications/
│       │   │   ├── blog/
│       │   │   └── admin/
│       │   ├── plugins/
│       │   │   ├── auth.ts
│       │   │   ├── cors.ts
│       │   │   └── websocket.ts
│       │   ├── middleware/
│       │   ├── jobs/
│       │   │   ├── email.job.ts
│       │   │   ├── sms.job.ts
│       │   │   └── reminder.job.ts
│       │   ├── lib/
│       │   │   ├── supabase.ts
│       │   │   ├── vnpay.ts
│       │   │   ├── momo.ts
│       │   │   ├── resend.ts
│       │   │   ├── esms.ts
│       │   │   └── agora.ts
│       │   ├── app.ts
│       │   └── server.ts
│       └── tsconfig.json
│
├── packages/
│   ├── shared/
│   │   ├── types/
│   │   └── schemas/
│   └── db/
│       └── prisma/
│           ├── schema.prisma
│           ├── migrations/
│           └── seed.ts
│
├── turbo.json
├── package.json
├── .env.example
└── .gitignore
```

## Error Handling Strategy

### Backend API Response Format
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100 }
}

{
  "success": false,
  "error": { "code": "APPOINTMENT_SLOT_TAKEN", "message": "..." }
}
```

### Frontend
- React Error Boundaries for unexpected crashes
- Toast notifications (sonner) for user-facing errors
- Skeleton loading states for async content
- Retry logic for transient network failures

## State Management (Zustand)

Zustand is used only for client-side state that cannot live in Server Components:
- **Auth store**: current user, JWT token, login/logout
- **Chat store**: active conversation, unread count, WebSocket connection
- **Notification store**: unread notifications, WebSocket subscription
- **UI store**: sidebar open/close, modal state

All server data (doctors, appointments, etc.) is fetched via React Server Components or SWR/React Query — not stored in Zustand.
