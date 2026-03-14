# BCare Phase 1 — MVP Core Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional medical appointment booking platform where patients can find doctors, view clinics, and book appointments, with dashboards for patients, doctors, and staff.

**Architecture:** Turborepo monorepo with Next.js frontend (App Router + Tailwind + shadcn/ui) and Fastify backend API. PostgreSQL via Supabase with Prisma ORM. JWT auth with refresh tokens. All realtime via Fastify WebSocket.

**Tech Stack:** TypeScript, Next.js 14, Fastify, Prisma, Supabase PostgreSQL, Tailwind CSS, shadcn/ui, Zustand, Zod, bcrypt, jsonwebtoken

**Spec:** `docs/superpowers/specs/2026-03-14-bcare-medical-platform-design.md`

---

## Chunk 1: Monorepo Setup + Database Schema

### Task 1: Initialize Turborepo monorepo

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/web/package.json`
- Create: `apps/api/package.json`
- Create: `packages/shared/package.json`
- Create: `packages/db/package.json`

- [ ] **Step 1: Initialize root package.json**

```bash
npm init -y
```

Edit `package.json`:
```json
{
  "name": "bcare",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "db:generate": "turbo db:generate",
    "db:push": "turbo db:push",
    "db:seed": "turbo db:seed"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "npm@10.0.0"
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules
.next
dist
.env
.env.local
.turbo
coverage
*.log
```

- [ ] **Step 4: Create .env.example**

```env
# Supabase
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"

# Auth
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
PORT=3001
```

- [ ] **Step 5: Commit**

```bash
git add package.json turbo.json .gitignore .env.example
git commit -m "feat: initialize turborepo monorepo root"
```

### Task 2: Setup packages/shared

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/doctor.ts`
- Create: `packages/shared/src/types/clinic.ts`
- Create: `packages/shared/src/types/appointment.ts`
- Create: `packages/shared/src/types/notification.ts`
- Create: `packages/shared/src/schemas/auth.schema.ts`
- Create: `packages/shared/src/schemas/booking.schema.ts`
- Create: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@bcare/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create type definitions**

`packages/shared/src/types/user.ts`:
```typescript
export enum Role {
  PATIENT = "PATIENT",
  DOCTOR = "DOCTOR",
  CLINIC = "CLINIC",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserPublic = Omit<User, "createdAt" | "updatedAt">;
```

`packages/shared/src/types/doctor.ts`:
```typescript
import { VerificationStatus } from "./user";

export interface Doctor {
  id: string;
  userId: string;
  clinicId: string | null;
  specialtyId: string;
  slug: string;
  title: string;
  bio: string | null;
  experienceYears: number;
  consultationFee: number;
  ratingAvg: number;
  isAvailable: boolean;
  verificationStatus: VerificationStatus;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

export interface Schedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  slotDuration: number; // minutes
  isActive: boolean;
}
```

`packages/shared/src/types/clinic.ts`:
```typescript
import { VerificationStatus } from "./user";

export interface Clinic {
  id: string;
  userId: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  city: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  description: string | null;
  images: string[];
  operatingHours: Record<string, string> | null;
  verificationStatus: VerificationStatus;
}
```

`packages/shared/src/types/appointment.ts`:
```typescript
export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  VNPAY = "VNPAY",
  MOMO = "MOMO",
  CASH = "CASH",
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string | null;
  scheduleId: string;
  date: Date;
  timeSlot: string; // "09:00"
  status: AppointmentStatus;
  symptomNote: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amount: number | null;
  createdAt: Date;
}
```

`packages/shared/src/types/notification.ts`:
```typescript
export enum NotificationType {
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
  GENERAL = "GENERAL",
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}
```

`packages/shared/src/types/index.ts`:
```typescript
export * from "./user";
export * from "./doctor";
export * from "./clinic";
export * from "./appointment";
export * from "./notification";
```

- [ ] **Step 4: Create Zod validation schemas**

`packages/shared/src/schemas/auth.schema.ts`:
```typescript
import { z } from "zod";
import { Role } from "../types";

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  fullName: z.string().min(2, "Tên tối thiểu 2 ký tự").max(100),
  role: z.enum([Role.PATIENT, Role.DOCTOR, Role.CLINIC]),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyPhoneSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6, "OTP phải có 6 chữ số"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
```

`packages/shared/src/schemas/booking.schema.ts`:
```typescript
import { z } from "zod";
import { AppointmentStatus, PaymentMethod } from "../types";

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (YYYY-MM-DD)"),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Giờ không hợp lệ (HH:mm)"),
  symptomNote: z.string().max(500).optional(),
  paymentMethod: z.enum([PaymentMethod.VNPAY, PaymentMethod.MOMO, PaymentMethod.CASH]).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum([
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
  ]),
});

export const listAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
```

`packages/shared/src/schemas/index.ts`:
```typescript
export * from "./auth.schema";
export * from "./booking.schema";
```

- [ ] **Step 5: Create constants and barrel export**

`packages/shared/src/constants.ts`:
```typescript
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SLOT_DURATION_MINUTES = 30;

export const DAYS_OF_WEEK = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
] as const;
```

`packages/shared/src/index.ts`:
```typescript
export * from "./types";
export * from "./schemas";
export * from "./constants";
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared package with types, schemas, and constants"
```

### Task 3: Setup packages/db with Prisma schema

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/seed.ts`
- Create: `packages/db/tsconfig.json`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@bcare/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "prisma": "^5.14.0",
    "tsx": "^4.10.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create Prisma schema**

`packages/db/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  PATIENT
  DOCTOR
  CLINIC
  STAFF
  ADMIN
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

enum PaymentMethod {
  VNPAY
  MOMO
  CASH
}

enum NotificationType {
  APPOINTMENT_CREATED
  APPOINTMENT_CONFIRMED
  APPOINTMENT_CANCELLED
  APPOINTMENT_REMINDER
  GENERAL
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  phone        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String   @map("full_name")
  avatarUrl    String?  @map("avatar_url")
  role         Role     @default(PATIENT)
  isVerified   Boolean  @default(false) @map("is_verified")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  doctor        Doctor?
  clinic        Clinic?
  staff         Staff?
  appointments  Appointment[]  @relation("PatientAppointments")
  reviews       Review[]       @relation("PatientReviews")
  notifications Notification[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Doctor {
  id                 String             @id @default(uuid())
  userId             String             @unique @map("user_id")
  clinicId           String?            @map("clinic_id")
  specialtyId        String             @map("specialty_id")
  slug               String             @unique
  title              String
  bio                String?
  experienceYears    Int                @default(0) @map("experience_years")
  consultationFee    Int                @default(0) @map("consultation_fee")
  ratingAvg          Float              @default(0) @map("rating_avg")
  isAvailable        Boolean            @default(true) @map("is_available")
  verificationStatus VerificationStatus @default(PENDING) @map("verification_status")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  clinic       Clinic?       @relation(fields: [clinicId], references: [id])
  specialty    Specialty     @relation(fields: [specialtyId], references: [id])
  schedules    Schedule[]
  appointments Appointment[]
  reviews      Review[]

  @@map("doctors")
}

model Clinic {
  id                 String             @id @default(uuid())
  userId             String             @unique @map("user_id")
  name               String
  slug               String             @unique
  address            String
  district           String
  city               String
  lat                Float?
  lng                Float?
  phone              String
  description        String?
  images             String[]           @default([])
  operatingHours     Json?              @map("operating_hours")
  verificationStatus VerificationStatus @default(PENDING) @map("verification_status")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  doctors      Doctor[]
  appointments Appointment[]
  staff        Staff[]

  @@map("clinics")
}

model Specialty {
  id          String  @id @default(uuid())
  name        String
  slug        String  @unique
  icon        String?
  description String?

  doctors Doctor[]

  @@map("specialties")
}

model Schedule {
  id           String  @id @default(uuid())
  doctorId     String  @map("doctor_id")
  dayOfWeek    Int     @map("day_of_week") // 0=Sunday
  startTime    String  @map("start_time")  // "08:00"
  endTime      String  @map("end_time")    // "17:00"
  slotDuration Int     @default(30) @map("slot_duration") // minutes
  isActive     Boolean @default(true) @map("is_active")

  doctor       Doctor        @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  appointments Appointment[]

  @@unique([doctorId, dayOfWeek])
  @@map("schedules")
}

model Appointment {
  id            String            @id @default(uuid())
  patientId     String            @map("patient_id")
  doctorId      String            @map("doctor_id")
  clinicId      String?           @map("clinic_id")
  scheduleId    String            @map("schedule_id")
  date          DateTime          @db.Date
  timeSlot      String            @map("time_slot") // "09:00"
  status        AppointmentStatus @default(PENDING)
  symptomNote   String?           @map("symptom_note")
  paymentStatus PaymentStatus     @default(UNPAID) @map("payment_status")
  paymentMethod PaymentMethod?    @map("payment_method")
  amount        Int?
  createdAt     DateTime          @default(now()) @map("created_at")

  patient  User     @relation("PatientAppointments", fields: [patientId], references: [id])
  doctor   Doctor   @relation(fields: [doctorId], references: [id])
  clinic   Clinic?  @relation(fields: [clinicId], references: [id])
  schedule Schedule @relation(fields: [scheduleId], references: [id])
  review   Review?

  @@unique([doctorId, date, timeSlot])
  @@map("appointments")
}

model Review {
  id            String   @id @default(uuid())
  patientId     String   @map("patient_id")
  doctorId      String   @map("doctor_id")
  appointmentId String   @unique @map("appointment_id")
  rating        Int      // 1-5
  comment       String?
  createdAt     DateTime @default(now()) @map("created_at")

  patient     User        @relation("PatientReviews", fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@map("reviews")
}

model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  title     String
  content   String
  type      NotificationType @default(GENERAL)
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model Staff {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  clinicId    String   @map("clinic_id")
  position    String
  permissions String[] @default([])

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  clinic Clinic @relation(fields: [clinicId], references: [id])

  @@map("staff")
}

model AuditLog {
  id           String   @id @default(uuid())
  userId       String?  @map("user_id")
  action       String
  resourceType String   @map("resource_type")
  resourceId   String?  @map("resource_id")
  ipAddress    String?  @map("ip_address")
  metadata     Json?
  createdAt    DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

- [ ] **Step 3: Create seed file**

`packages/db/prisma/seed.ts`:
```typescript
import { PrismaClient, Role, VerificationStatus } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Specialties
  const specialties = await Promise.all([
    prisma.specialty.create({
      data: { name: "Tim mạch", slug: "tim-mach", icon: "heart-pulse", description: "Khám và điều trị các bệnh tim mạch" },
    }),
    prisma.specialty.create({
      data: { name: "Nha khoa", slug: "nha-khoa", icon: "smile", description: "Chăm sóc răng miệng" },
    }),
    prisma.specialty.create({
      data: { name: "Mắt", slug: "mat", icon: "eye", description: "Khám và điều trị các bệnh về mắt" },
    }),
    prisma.specialty.create({
      data: { name: "Da liễu", slug: "da-lieu", icon: "shield", description: "Khám và điều trị các bệnh da liễu" },
    }),
    prisma.specialty.create({
      data: { name: "Nội khoa", slug: "noi-khoa", icon: "stethoscope", description: "Khám nội tổng quát" },
    }),
    prisma.specialty.create({
      data: { name: "Nhi khoa", slug: "nhi-khoa", icon: "baby", description: "Khám và điều trị bệnh trẻ em" },
    }),
    prisma.specialty.create({
      data: { name: "Xương khớp", slug: "xuong-khop", icon: "bone", description: "Khám và điều trị cơ xương khớp" },
    }),
    prisma.specialty.create({
      data: { name: "Tai mũi họng", slug: "tai-mui-hong", icon: "ear", description: "Khám tai mũi họng" },
    }),
  ]);

  // Admin user
  const adminPassword = await hash("Admin@123456", 12);
  await prisma.user.create({
    data: {
      email: "admin@bcare.vn",
      phone: "0900000000",
      passwordHash: adminPassword,
      fullName: "BCare Admin",
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Clinic user + clinic
  const clinicPassword = await hash("Clinic@123456", 12);
  const clinicUser = await prisma.user.create({
    data: {
      email: "clinic@bcare.vn",
      phone: "0900000001",
      passwordHash: clinicPassword,
      fullName: "Phòng khám Đa khoa Sài Gòn",
      role: Role.CLINIC,
      isVerified: true,
    },
  });

  const clinic = await prisma.clinic.create({
    data: {
      userId: clinicUser.id,
      name: "Phòng khám Đa khoa Sài Gòn",
      slug: "phong-kham-da-khoa-sai-gon",
      address: "123 Nguyễn Huệ, Quận 1",
      district: "Quận 1",
      city: "Hồ Chí Minh",
      lat: 10.7769,
      lng: 106.7009,
      phone: "028 1234 5678",
      description: "Phòng khám đa khoa hiện đại với đội ngũ bác sĩ giàu kinh nghiệm",
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  // Doctor users
  const doctorPassword = await hash("Doctor@123456", 12);
  const doctorData = [
    { name: "BS. Nguyễn Văn An", email: "doctor1@bcare.vn", phone: "0900000010", specialty: 0, title: "PGS.TS", exp: 15, fee: 500000 },
    { name: "BS. Trần Thị Bình", email: "doctor2@bcare.vn", phone: "0900000011", specialty: 1, title: "ThS.BS", exp: 10, fee: 400000 },
    { name: "BS. Lê Hoàng Cường", email: "doctor3@bcare.vn", phone: "0900000012", specialty: 2, title: "TS.BS", exp: 12, fee: 450000 },
    { name: "BS. Phạm Minh Đức", email: "doctor4@bcare.vn", phone: "0900000013", specialty: 4, title: "BS.CKI", exp: 8, fee: 350000 },
    { name: "BS. Hoàng Thị Lan", email: "doctor5@bcare.vn", phone: "0900000014", specialty: 5, title: "PGS.TS", exp: 20, fee: 600000 },
  ];

  for (const d of doctorData) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        phone: d.phone,
        passwordHash: doctorPassword,
        fullName: d.name,
        role: Role.DOCTOR,
        isVerified: true,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
        specialtyId: specialties[d.specialty].id,
        slug: d.email.replace("@bcare.vn", ""),
        title: d.title,
        bio: `Bác sĩ ${d.name} có ${d.exp} năm kinh nghiệm.`,
        experienceYears: d.exp,
        consultationFee: d.fee,
        ratingAvg: 4.5 + Math.random() * 0.5,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    // Schedules: Mon-Fri
    for (let day = 1; day <= 5; day++) {
      await prisma.schedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "17:00",
          slotDuration: 30,
        },
      });
    }
  }

  // Patient user
  const patientPassword = await hash("Patient@123456", 12);
  await prisma.user.create({
    data: {
      email: "patient@bcare.vn",
      phone: "0900000020",
      passwordHash: patientPassword,
      fullName: "Nguyễn Văn Bệnh Nhân",
      role: Role.PATIENT,
      isVerified: true,
    },
  });

  // Staff user
  const staffPassword = await hash("Staff@123456", 12);
  const staffUser = await prisma.user.create({
    data: {
      email: "staff@bcare.vn",
      phone: "0900000030",
      passwordHash: staffPassword,
      fullName: "Lê Thị Lễ Tân",
      role: Role.STAFF,
      isVerified: true,
    },
  });

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      clinicId: clinic.id,
      position: "Lễ tân",
      permissions: ["manage_appointments", "view_patients"],
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Create db package index**

`packages/db/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["prisma/seed.ts"]
}
```

- [ ] **Step 5: Install dependencies and generate Prisma client**

```bash
cd packages/db && npm install
npx prisma generate
```

- [ ] **Step 6: Commit**

```bash
git add packages/db/
git commit -m "feat: add database package with Prisma schema and seed data"
```

### Task 4: Setup Fastify backend app

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/response.ts`
- Create: `apps/api/src/plugins/cors.ts`
- Create: `apps/api/src/plugins/auth.ts`
- Create: `apps/api/src/middleware/authenticate.ts`
- Create: `apps/api/src/middleware/authorize.ts`
- Create: `apps/api/src/middleware/validate.ts`
- Create: `apps/api/src/middleware/rate-limit.ts`

- [ ] **Step 1: Create apps/api/package.json**

```json
{
  "name": "@bcare/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@bcare/shared": "*",
    "@prisma/client": "^5.14.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/jwt": "^8.0.0",
    "fastify": "^4.27.0",
    "bcrypt": "^5.1.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^20.12.0",
    "tsx": "^4.10.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create Prisma client singleton**

`apps/api/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});
```

- [ ] **Step 4: Create response helper**

`apps/api/src/lib/response.ts`:
```typescript
export function success<T>(data: T, meta?: { page: number; limit: number; total: number }) {
  return { success: true as const, data, ...(meta && { meta }) };
}

export function error(code: string, message: string, statusCode = 400) {
  return {
    success: false as const,
    error: { code, message },
    statusCode,
  };
}
```

- [ ] **Step 5: Create middleware files**

`apps/api/src/middleware/authenticate.ts`:
```typescript
import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Token không hợp lệ hoặc đã hết hạn" },
    });
  }
}
```

`apps/api/src/middleware/authorize.ts`:
```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@bcare/shared";

export function authorize(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: Role };
    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Bạn không có quyền truy cập" },
      });
    }
  };
}
```

`apps/api/src/middleware/validate.ts`:
```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request[source];
      const parsed = schema.parse(data);
      (request as any)[source] = parsed;
    } catch (err) {
      if (err instanceof ZodError) {
        reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: err.errors.map((e) => e.message).join(", "),
          },
        });
      }
    }
  };
}
```

- [ ] **Step 6: Create app.ts and server.ts**

`apps/api/src/app.ts`:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, {
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  });

  // Decorate with refresh secret for separate refresh token signing
  app.decorate("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production");

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Health check
  app.get("/api/health", async () => ({ status: "ok" }));

  return app;
}
```

`apps/api/src/server.ts`:
```typescript
import { buildApp } from "./app";

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || "3001");

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`API server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
```

- [ ] **Step 7: Verify API starts**

```bash
cd apps/api && npm install && npm run dev
```

Expected: `API server running on http://localhost:3001`

Test: `curl http://localhost:3001/api/health` → `{"status":"ok"}`

- [ ] **Step 8: Commit**

```bash
git add apps/api/
git commit -m "feat: add Fastify backend with auth middleware and health check"
```

### Task 5: Setup Next.js frontend app

**Files:**
- Create: `apps/web/` (via create-next-app)
- Create: `apps/web/tailwind.config.ts` (customized)
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/stores/auth.store.ts`

- [ ] **Step 1: Create Next.js app**

```bash
cd apps && npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git
```

- [ ] **Step 2: Install additional dependencies**

```bash
cd apps/web && npm install @bcare/shared zustand sonner lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd apps/web && npx shadcn@latest init -d
```

Add key components:
```bash
npx shadcn@latest add button card input label select skeleton toast dialog dropdown-menu avatar badge separator sheet
```

- [ ] **Step 4: Customize tailwind.config.ts with BCare design tokens**

Update `apps/web/tailwind.config.ts` to add BCare color palette:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0066CC",
          foreground: "#FFFFFF",
          50: "#E8F4FD",
          100: "#B8DFFA",
          500: "#0066CC",
          600: "#0052A3",
          700: "#003D7A",
        },
        accent: {
          DEFAULT: "#00A86B",
          foreground: "#FFFFFF",
        },
        neutral: {
          DEFAULT: "#F8FAFB",
        },
        danger: {
          DEFAULT: "#DC2626",
        },
        border: "#E5E7EB",
        text: {
          DEFAULT: "#1A1A2E",
          light: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        hover: "0 4px 12px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 5: Create API client**

`apps/web/lib/api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiOptions extends RequestInit {
  token?: string;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message || "Đã có lỗi xảy ra");
  }

  return json.data;
}
```

`apps/web/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
```

- [ ] **Step 6: Create auth store**

`apps/web/stores/auth.store.ts`:
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
    }),
    { name: "bcare-auth" }
  )
);
```

- [ ] **Step 7: Verify frontend starts**

```bash
cd apps/web && npm run dev
```

Expected: Next.js running on `http://localhost:3000`

- [ ] **Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat: add Next.js frontend with shadcn/ui, design tokens, and auth store"
```

### Task 6: Install root dependencies and verify monorepo

- [ ] **Step 1: Install root dependencies**

```bash
npm install
```

- [ ] **Step 2: Verify turbo dev runs both apps**

```bash
npx turbo dev
```

Expected: Both `web` (port 3000) and `api` (port 3001) start successfully.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: complete monorepo setup with turbo dev"
```

---

## Chunk 2: Auth System

### Task 7: Auth module — Backend registration

**Files:**
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create auth.service.ts**

```typescript
import { prisma } from "../../lib/prisma";
import { hash, compare } from "bcrypt";
import { RegisterInput, LoginInput, Role } from "@bcare/shared";

const BCRYPT_ROUNDS = 12;

export class AuthService {
  async register(input: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) throw { code: "EMAIL_EXISTS", message: "Email đã được sử dụng", status: 409 };

    const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existingPhone) throw { code: "PHONE_EXISTS", message: "Số điện thoại đã được sử dụng", status: 409 };

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        fullName: input.fullName,
        role: input.role as Role,
      },
      select: { id: true, email: true, phone: true, fullName: true, role: true, avatarUrl: true },
    });

    return user;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng", status: 401 };

    const valid = await compare(input.password, user.passwordHash);
    if (!valid) throw { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng", status: 401 };

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, fullName: true, role: true, avatarUrl: true, isVerified: true },
    });
    if (!user) throw { code: "USER_NOT_FOUND", message: "Người dùng không tồn tại", status: 404 };
    return user;
  }
}

export const authService = new AuthService();
```

- [ ] **Step 2: Create auth.controller.ts**

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import { RegisterInput, LoginInput } from "@bcare/shared";
import { success } from "../../lib/response";

export async function registerController(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
  try {
    const user = await authService.register(request.body);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "15m" });
    const refreshToken = await reply.jwtSign({ id: user.id, type: "refresh" }, { expiresIn: "7d", key: (request.server as any).JWT_REFRESH_SECRET });
    reply.status(201).send(success({ user, token, refreshToken }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function loginController(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
  try {
    const user = await authService.login(request.body);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "15m" });
    const refreshToken = await reply.jwtSign({ id: user.id, type: "refresh" }, { expiresIn: "7d", key: (request.server as any).JWT_REFRESH_SECRET });
    reply.send(success({ user, token, refreshToken }));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}

export async function refreshController(request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
  try {
    const decoded = request.server.jwt.verify<{ id: string; type: string }>(request.body.refreshToken);
    if (decoded.type !== "refresh") throw { code: "INVALID_TOKEN", message: "Token không hợp lệ", status: 401 };

    const user = await authService.getProfile(decoded.id);
    const token = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: "15m" });
    const newRefreshToken = await reply.jwtSign({ id: user.id, type: "refresh" }, { expiresIn: "7d" });
    reply.send(success({ user, token, refreshToken: newRefreshToken }));
  } catch (err: any) {
    reply.status(err.status || 401).send({
      success: false,
      error: { code: err.code || "INVALID_TOKEN", message: err.message || "Token không hợp lệ" },
    });
  }
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.user as { id: string };
    const user = await authService.getProfile(id);
    reply.send(success(user));
  } catch (err: any) {
    reply.status(err.status || 500).send({
      success: false,
      error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
  }
}
```

- [ ] **Step 3: Create auth.routes.ts**

```typescript
import { FastifyInstance } from "fastify";
import { registerController, loginController, refreshController, meController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { registerSchema, loginSchema, refreshTokenSchema } from "@bcare/shared";

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", { preHandler: [validate(registerSchema)] }, registerController);
  app.post("/api/auth/login", { preHandler: [validate(loginSchema)] }, loginController);
  app.post("/api/auth/refresh", { preHandler: [validate(refreshTokenSchema)] }, refreshController);
  app.get("/api/auth/me", { preHandler: [authenticate] }, meController);
}
```

- [ ] **Step 4: Register auth routes in app.ts**

Add to `apps/api/src/app.ts`:
```typescript
import { authRoutes } from "./modules/auth/auth.routes";

// After plugin registrations, before return:
await app.register(authRoutes);
```

- [ ] **Step 5: Test auth endpoints manually**

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","phone":"0901234567","password":"Test@1234","fullName":"Test User","role":"PATIENT"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
```

Expected: Both return `{ "success": true, "data": { "user": {...}, "token": "...", "refreshToken": "..." } }`

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/auth/
git commit -m "feat: add auth module with register, login, refresh, and me endpoints"
```

### Task 8: Auth frontend — Login & Register pages

**Files:**
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/register/page.tsx`
- Create: `apps/web/app/(auth)/layout.tsx`
- Create: `apps/web/components/auth/login-form.tsx`
- Create: `apps/web/components/auth/register-form.tsx`

- [ ] **Step 1: Create auth layout**

`apps/web/app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create login form component**

`apps/web/components/auth/login-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ user: any; token: string; refreshToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.user, data.token, data.refreshToken);
      toast.success("Đăng nhập thành công!");

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        PATIENT: "/patient/dashboard",
        DOCTOR: "/doctor/dashboard",
        CLINIC: "/clinic/dashboard",
        STAFF: "/staff/dashboard",
        ADMIN: "/admin/dashboard",
      };
      router.push(redirectMap[data.user.role] || "/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Đăng nhập BCare</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-text-light">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Đăng ký
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

`apps/web/app/(auth)/login/page.tsx`:
```tsx
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 4: Create register form component**

`apps/web/components/auth/register-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function RegisterForm() {
  const [form, setForm] = useState({ email: "", phone: "", password: "", fullName: "", role: "PATIENT" });
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ user: any; token: string; refreshToken: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAuth(data.user, data.token, data.refreshToken);
      toast.success("Đăng ký thành công!");
      router.push("/patient/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Đăng ký BCare</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" placeholder="0901234567" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Bạn là</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PATIENT">Bệnh nhân</SelectItem>
                <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                <SelectItem value="CLINIC">Phòng khám</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-text-light">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 5: Create register page**

`apps/web/app/(auth)/register/page.tsx`:
```tsx
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 6: Verify login/register pages render**

Open `http://localhost:3000/login` and `http://localhost:3000/register`. Both should show styled forms.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/\(auth\)/ apps/web/components/auth/
git commit -m "feat: add login and register pages with auth forms"
```

---

## Chunk 3: Doctors, Clinics & Specialties API

### Task 9: Specialties API module

**Files:**
- Create: `apps/api/src/modules/specialties/specialties.service.ts`
- Create: `apps/api/src/modules/specialties/specialties.controller.ts`
- Create: `apps/api/src/modules/specialties/specialties.routes.ts`

- [ ] **Step 1: Create specialties service**

```typescript
import { prisma } from "../../lib/prisma";

export class SpecialtiesService {
  async findAll() {
    return prisma.specialty.findMany({
      include: { _count: { select: { doctors: true } } },
      orderBy: { name: "asc" },
    });
  }

  async findBySlug(slug: string) {
    const specialty = await prisma.specialty.findUnique({ where: { slug } });
    if (!specialty) throw { code: "NOT_FOUND", message: "Chuyên khoa không tồn tại", status: 404 };
    return specialty;
  }
}

export const specialtiesService = new SpecialtiesService();
```

- [ ] **Step 2: Create controller and routes**

Controller: simple handlers calling service, wrapping with `success()`.
Routes: `GET /api/specialties` and `GET /api/specialties/:slug`.

- [ ] **Step 3: Register routes in app.ts**

- [ ] **Step 4: Test endpoint**

```bash
curl http://localhost:3001/api/specialties
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/specialties/
git commit -m "feat: add specialties API module"
```

### Task 10: Doctors API module

**Files:**
- Create: `apps/api/src/modules/doctors/doctors.service.ts`
- Create: `apps/api/src/modules/doctors/doctors.controller.ts`
- Create: `apps/api/src/modules/doctors/doctors.routes.ts`
- Create: `apps/api/src/modules/doctors/doctors.schema.ts`

- [ ] **Step 1: Create doctors.schema.ts**

```typescript
import { z } from "zod";

export const listDoctorsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  specialty: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["rating", "experience", "fee"]).default("rating"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListDoctorsInput = z.infer<typeof listDoctorsSchema>;
```

- [ ] **Step 2: Create doctors.service.ts**

```typescript
import { prisma } from "../../lib/prisma";
import { ListDoctorsInput } from "./doctors.schema";
import { VerificationStatus } from "@prisma/client";

export class DoctorsService {
  async findAll(input: ListDoctorsInput) {
    const { page, limit, specialty, city, search, sort, order } = input;
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: VerificationStatus.VERIFIED,
      isAvailable: true,
    };

    if (specialty) where.specialty = { slug: specialty };
    if (city) where.clinic = { city: { contains: city, mode: "insensitive" } };
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { specialty: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const sortMap: Record<string, any> = {
      rating: { ratingAvg: order },
      experience: { experienceYears: order },
      fee: { consultationFee: order },
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortMap[sort] || { ratingAvg: "desc" },
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
          specialty: { select: { name: true, slug: true } },
          clinic: { select: { name: true, city: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page, limit };
  }

  async findBySlug(slug: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { slug },
      include: {
        user: { select: { fullName: true, avatarUrl: true, phone: true } },
        specialty: true,
        clinic: { select: { name: true, slug: true, address: true, city: true, phone: true } },
        schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { appointment: { include: { patient: { select: { fullName: true, avatarUrl: true } } } } },
        },
        _count: { select: { reviews: true, appointments: true } },
      },
    });
    if (!doctor) throw { code: "NOT_FOUND", message: "Bác sĩ không tồn tại", status: 404 };
    return doctor;
  }

  async getSchedules(doctorId: string) {
    return prisma.schedule.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async getReviews(doctorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { doctorId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { doctorId } }),
    ]);
    return { reviews, total, page, limit };
  }
}

export const doctorsService = new DoctorsService();
```

- [ ] **Step 3: Create controller and routes**

Routes:
```
GET /api/doctors              → list with filters
GET /api/doctors/:slug        → detail by slug
GET /api/doctors/:id/schedules → schedules
GET /api/doctors/:id/reviews   → reviews
```

- [ ] **Step 4: Register in app.ts and test**

```bash
curl "http://localhost:3001/api/doctors?page=1&limit=5"
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/doctors/
git commit -m "feat: add doctors API module with search, detail, schedules, reviews"
```

### Task 11: Clinics API module

**Files:**
- Create: `apps/api/src/modules/clinics/clinics.service.ts`
- Create: `apps/api/src/modules/clinics/clinics.controller.ts`
- Create: `apps/api/src/modules/clinics/clinics.routes.ts`

- [ ] **Step 1: Create clinics service**

Similar to doctors: `findAll` with pagination + filters (city, search), `findBySlug` with doctors included.

- [ ] **Step 2: Create controller and routes**

Routes:
```
GET /api/clinics              → list
GET /api/clinics/:slug        → detail
GET /api/clinics/:id/doctors  → doctors in clinic
```

- [ ] **Step 3: Register and test**

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/clinics/
git commit -m "feat: add clinics API module"
```

---

## Chunk 4: Public Frontend Pages

### Task 12: Layout — Header & Footer

**Files:**
- Create: `apps/web/components/layout/header.tsx`
- Create: `apps/web/components/layout/footer.tsx`
- Create: `apps/web/components/layout/mobile-nav.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Create Header**

`apps/web/components/layout/header.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { Menu, X, Search, User } from "lucide-react";
import { MobileNav } from "./mobile-nav";

const NAV_ITEMS = [
  { label: "Tìm bác sĩ", href: "/doctors" },
  { label: "Phòng khám", href: "/clinics" },
  { label: "Chuyên khoa", href: "/specialties" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-primary">
          BCare
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-text-light hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href={`/${user.role.toLowerCase()}/dashboard`}>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.fullName}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">Đăng nhập</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary hover:bg-primary-600">Đăng ký</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </header>
  );
}
```

- [ ] **Step 2: Create MobileNav**

A slide-down nav with the same links + login/register buttons for mobile.

- [ ] **Step 3: Create Footer**

`apps/web/components/layout/footer.tsx` — Simple footer with BCare branding, links to sections, contact info, copyright.

- [ ] **Step 4: Update root layout**

`apps/web/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "BCare - Đặt lịch khám bệnh trực tuyến",
  description: "Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-neutral text-text`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/layout/ apps/web/app/layout.tsx
git commit -m "feat: add header, footer, mobile nav, and root layout"
```

### Task 13: Homepage

**Files:**
- Create: `apps/web/app/(public)/page.tsx`
- Create: `apps/web/components/home/hero-section.tsx`
- Create: `apps/web/components/home/specialties-section.tsx`
- Create: `apps/web/components/home/top-doctors-section.tsx`
- Create: `apps/web/components/home/how-it-works-section.tsx`
- Create: `apps/web/components/shared/doctor-card.tsx`

- [ ] **Step 1: Create HeroSection**

Large hero with search bar: specialty dropdown + location dropdown + "Tìm bác sĩ" button. Clean medical background (#E8F4FD). Headline: "Đặt lịch khám dễ dàng, nhanh chóng".

- [ ] **Step 2: Create SpecialtiesSection**

Grid of 8 specialty cards fetched from API. Each card: icon (Lucide) + name + doctor count. Links to `/specialties/{slug}`.

- [ ] **Step 3: Create DoctorCard shared component**

`apps/web/components/shared/doctor-card.tsx`:
```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface DoctorCardProps {
  slug: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  specialty: string;
  clinicName: string | null;
  city: string | null;
  ratingAvg: number;
  reviewCount: number;
  consultationFee: number;
}

export function DoctorCard({ slug, name, title, avatarUrl, specialty, clinicName, city, ratingAvg, reviewCount, consultationFee }: DoctorCardProps) {
  return (
    <Card className="shadow-card hover:shadow-hover transition-shadow">
      <CardContent className="p-6 text-center">
        <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-primary-50">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback className="bg-primary-50 text-primary text-lg">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-text">{title} {name}</h3>
        <Badge variant="secondary" className="mt-1">{specialty}</Badge>
        {city && (
          <p className="text-sm text-text-light mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> {city}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 mt-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{ratingAvg.toFixed(1)}</span>
          <span className="text-sm text-text-light">({reviewCount})</span>
        </div>
        <p className="text-sm font-medium text-primary mt-2">{formatVND(consultationFee)}</p>
        <Link href={`/doctors/${slug}`}>
          <Button className="w-full mt-3 bg-primary hover:bg-primary-600" size="sm">
            Đặt lịch khám
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create TopDoctorsSection**

Horizontal scroll / grid of DoctorCard components. Fetches top-rated doctors from API.

- [ ] **Step 5: Create HowItWorksSection**

3 steps: 1. Tìm bác sĩ → 2. Chọn giờ khám → 3. Xác nhận lịch hẹn. Simple icon + title + description per step.

- [ ] **Step 6: Assemble Homepage**

`apps/web/app/(public)/page.tsx`:
```tsx
import { HeroSection } from "@/components/home/hero-section";
import { SpecialtiesSection } from "@/components/home/specialties-section";
import { TopDoctorsSection } from "@/components/home/top-doctors-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SpecialtiesSection />
      <TopDoctorsSection />
      <HowItWorksSection />
    </>
  );
}
```

- [ ] **Step 7: Verify homepage renders**

Open `http://localhost:3000` — should show all sections with data from API.

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/\(public\)/page.tsx apps/web/components/home/ apps/web/components/shared/doctor-card.tsx
git commit -m "feat: add homepage with hero, specialties, top doctors, and how-it-works"
```

### Task 14: Doctor search page

**Files:**
- Create: `apps/web/app/(public)/doctors/page.tsx`
- Create: `apps/web/components/doctors/doctor-filters.tsx`
- Create: `apps/web/components/doctors/doctor-list.tsx`

- [ ] **Step 1: Create DoctorFilters component**

Sidebar/top bar with: specialty select, city select, sort dropdown, search input. Uses URL search params for state.

- [ ] **Step 2: Create DoctorList component**

Grid of DoctorCards with pagination. Fetches from `GET /api/doctors` with query params from filters.

- [ ] **Step 3: Assemble search page**

Server component that reads searchParams and passes to client components.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(public\)/doctors/ apps/web/components/doctors/
git commit -m "feat: add doctor search page with filters and pagination"
```

### Task 15: Doctor detail page

**Files:**
- Create: `apps/web/app/(public)/doctors/[slug]/page.tsx`
- Create: `apps/web/components/doctors/doctor-profile.tsx`
- Create: `apps/web/components/doctors/doctor-schedule.tsx`
- Create: `apps/web/components/doctors/doctor-reviews.tsx`

- [ ] **Step 1: Create DoctorProfile component**

Avatar, name, title, specialty, bio, experience, consultation fee, clinic info.

- [ ] **Step 2: Create DoctorSchedule component**

Shows available time slots by day. User can select a date → shows available slots for that day based on schedule + existing appointments. Calendar-style date picker.

- [ ] **Step 3: Create DoctorReviews component**

List of reviews with rating, comment, patient name. Pagination.

- [ ] **Step 4: Assemble detail page**

SSR page that fetches doctor by slug, renders profile + schedule + reviews.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(public\)/doctors/\[slug\]/ apps/web/components/doctors/
git commit -m "feat: add doctor detail page with profile, schedule, and reviews"
```

### Task 16: Clinic pages

**Files:**
- Create: `apps/web/app/(public)/clinics/page.tsx`
- Create: `apps/web/app/(public)/clinics/[slug]/page.tsx`
- Create: `apps/web/components/clinics/clinic-card.tsx`

- [ ] **Step 1: Create ClinicCard component**

Image, name, address, doctor count, operating hours.

- [ ] **Step 2: Create clinic listing page**

Grid of ClinicCards with pagination. Filter by city.

- [ ] **Step 3: Create clinic detail page**

Clinic info + list of doctors (using DoctorCard).

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(public\)/clinics/ apps/web/components/clinics/
git commit -m "feat: add clinic listing and detail pages"
```

---

## Chunk 5: Appointment Booking

### Task 17: Appointments API module

**Files:**
- Create: `apps/api/src/modules/appointments/appointments.service.ts`
- Create: `apps/api/src/modules/appointments/appointments.controller.ts`
- Create: `apps/api/src/modules/appointments/appointments.routes.ts`

- [ ] **Step 1: Create appointments.service.ts**

Key method — `create` with concurrency control:
```typescript
async create(patientId: string, input: CreateAppointmentInput) {
  return prisma.$transaction(async (tx) => {
    // Check slot availability with row-level lock (SELECT FOR UPDATE)
    const existing = await tx.$queryRaw<any[]>`
      SELECT id FROM appointments
      WHERE doctor_id = ${input.doctorId}
        AND date = ${new Date(input.date)}::date
        AND time_slot = ${input.timeSlot}
        AND status != 'CANCELLED'
      FOR UPDATE
    `;
    if (existing.length > 0) throw { code: "SLOT_TAKEN", message: "Khung giờ này đã được đặt", status: 409 };

    // Get doctor for clinic + fee
    const doctor = await tx.doctor.findUnique({ where: { id: input.doctorId } });
    if (!doctor) throw { code: "DOCTOR_NOT_FOUND", message: "Bác sĩ không tồn tại", status: 404 };

    return tx.appointment.create({
      data: {
        patientId,
        doctorId: input.doctorId,
        clinicId: doctor.clinicId,
        scheduleId: input.scheduleId,
        date: new Date(input.date),
        timeSlot: input.timeSlot,
        symptomNote: input.symptomNote,
        paymentMethod: input.paymentMethod,
        amount: doctor.consultationFee,
      },
      include: {
        doctor: { include: { user: { select: { fullName: true } }, specialty: true } },
        clinic: { select: { name: true, address: true } },
      },
    });
  });
}
```

Other methods: `findAll` (filtered by role — patient sees theirs, doctor sees theirs, staff sees clinic's), `findById`, `updateStatus`.

- [ ] **Step 2: Create controller**

Handles role-based filtering in `findAll`:
- PATIENT: `where.patientId = userId`
- DOCTOR: `where.doctorId = doctorId`
- STAFF: `where.clinicId = staffClinicId`

- [ ] **Step 3: Create routes**

```
POST   /api/appointments    → authenticate + authorize(PATIENT) + validate
GET    /api/appointments    → authenticate
GET    /api/appointments/:id → authenticate
PATCH  /api/appointments/:id → authenticate
```

- [ ] **Step 4: Register and test**

```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer <patient-token>" \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"...","scheduleId":"...","date":"2026-03-20","timeSlot":"09:00"}'
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/appointments/
git commit -m "feat: add appointments API with concurrency-safe booking"
```

### Task 18: Available slots API

**Files:**
- Create: `apps/api/src/modules/doctors/slots.service.ts`

- [ ] **Step 1: Create slots service**

Given a doctorId and date, compute available time slots:
1. Find the doctor's schedule for that day_of_week
2. Generate all possible slots from startTime to endTime by slotDuration
3. Query existing non-cancelled appointments for that doctor+date
4. Return slots with `available: boolean`

```typescript
async getAvailableSlots(doctorId: string, date: string) {
  const dayOfWeek = new Date(date).getDay();
  const schedule = await prisma.schedule.findFirst({
    where: { doctorId, dayOfWeek, isActive: true },
  });
  if (!schedule) return [];

  const slots = generateTimeSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: new Date(date),
      status: { not: "CANCELLED" },
    },
    select: { timeSlot: true },
  });
  const bookedSet = new Set(booked.map((a) => a.timeSlot));

  return slots.map((slot) => ({
    time: slot,
    available: !bookedSet.has(slot),
  }));
}
```

- [ ] **Step 2: Add route**

`GET /api/doctors/:id/slots?date=2026-03-20`

- [ ] **Step 3: Test**

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/doctors/slots.service.ts
git commit -m "feat: add available time slots endpoint"
```

### Task 19: Booking UI — BookingModal

**Files:**
- Create: `apps/web/components/booking/booking-modal.tsx`
- Create: `apps/web/components/booking/time-slot-picker.tsx`
- Create: `apps/web/components/booking/booking-confirmation.tsx`

- [ ] **Step 1: Create TimeSlotPicker**

Fetches available slots for selected date. Shows a grid of time buttons. Green = available, gray = taken.

- [ ] **Step 2: Create BookingModal**

Dialog with steps:
1. Select date (calendar)
2. Select time slot (TimeSlotPicker)
3. Optional symptom note
4. Confirmation summary
5. Submit → POST /api/appointments

- [ ] **Step 3: Create BookingConfirmation**

Success screen after booking: appointment details, doctor name, date/time, what to do next.

- [ ] **Step 4: Integrate BookingModal into doctor detail page**

"Đặt lịch khám" button opens BookingModal with doctorId pre-filled.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/booking/
git commit -m "feat: add booking modal with date/time picker and confirmation"
```

---

## Chunk 6: Dashboards

### Task 20: Notifications API module (must exist before dashboard pages)

**Files:**
- Create: `apps/api/src/modules/notifications/notifications.service.ts`
- Create: `apps/api/src/modules/notifications/notifications.controller.ts`
- Create: `apps/api/src/modules/notifications/notifications.routes.ts`

- [ ] **Step 1: Create notifications service**

Methods: `findAll(userId, page, limit)`, `markAsRead(id, userId)`, `markAllAsRead(userId)`, `create(userId, title, content, type)`.

- [ ] **Step 2: Create controller and routes**

```
GET    /api/notifications          → authenticate
PATCH  /api/notifications/:id/read → authenticate
PATCH  /api/notifications/read-all → authenticate
```

- [ ] **Step 3: Register in app.ts**

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/notifications/
git commit -m "feat: add notifications API module"
```

### Task 21: Dashboard layout

**Files:**
- Create: `apps/web/components/layout/dashboard-layout.tsx`
- Create: `apps/web/components/layout/dashboard-sidebar.tsx`
- Create: `apps/web/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create DashboardSidebar**

Sidebar with navigation links based on user role. Uses Lucide icons. Active state highlighting. Collapsible on mobile (Sheet component).

Role-based nav items:
- PATIENT: Dashboard, Lịch hẹn, Thông báo, Cá nhân
- DOCTOR: Dashboard, Lịch hẹn, Lịch làm việc, Bệnh nhân, Đánh giá, Hồ sơ
- STAFF: Dashboard, Lịch hẹn, Bệnh nhân

- [ ] **Step 2: Create DashboardLayout**

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-6 bg-neutral">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard route group layout**

`apps/web/app/(dashboard)/layout.tsx` — wraps children with DashboardLayout. Checks auth, redirects to /login if not authenticated.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/layout/dashboard-layout.tsx apps/web/components/layout/dashboard-sidebar.tsx apps/web/app/\(dashboard\)/layout.tsx
git commit -m "feat: add dashboard layout with role-based sidebar"
```

### Task 21: Patient dashboard

**Files:**
- Create: `apps/web/app/(dashboard)/patient/dashboard/page.tsx`
- Create: `apps/web/app/(dashboard)/patient/appointments/page.tsx`
- Create: `apps/web/app/(dashboard)/patient/appointments/[id]/page.tsx`
- Create: `apps/web/app/(dashboard)/patient/profile/page.tsx`
- Create: `apps/web/app/(dashboard)/patient/notifications/page.tsx`
- Create: `apps/web/components/appointments/appointment-card.tsx`
- Create: `apps/web/components/appointments/appointment-list.tsx`

- [ ] **Step 1: Create AppointmentCard component**

Shows: doctor name, specialty, date/time, status badge (color-coded), clinic name. Actions: cancel button (if PENDING/CONFIRMED).

- [ ] **Step 2: Create patient dashboard page**

Overview: upcoming appointments count, recent appointments list (3), quick action buttons.

- [ ] **Step 3: Create patient appointments page**

Full list of appointments with status filter tabs (All, Pending, Confirmed, Completed, Cancelled). Pagination.

- [ ] **Step 4: Create appointment detail page**

Full appointment info + doctor details + cancel button (with confirmation dialog).

- [ ] **Step 5: Create patient profile page**

Form to view/edit: fullName, email, phone, avatarUrl.

- [ ] **Step 6: Create notifications page**

List of notifications with read/unread status. Mark as read. Mark all as read.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/\(dashboard\)/patient/ apps/web/components/appointments/
git commit -m "feat: add patient dashboard with appointments, profile, and notifications"
```

### Task 23: Doctor dashboard

**Files:**
- Create: `apps/web/app/(dashboard)/doctor/dashboard/page.tsx`
- Create: `apps/web/app/(dashboard)/doctor/appointments/page.tsx`
- Create: `apps/web/app/(dashboard)/doctor/schedule/page.tsx`
- Create: `apps/web/app/(dashboard)/doctor/profile/page.tsx`
- Create: `apps/web/components/doctor/schedule-manager.tsx`

- [ ] **Step 1: Create doctor dashboard page**

Overview: today's appointments, total patients, rating, upcoming appointments.

- [ ] **Step 2: Create doctor appointments page**

List of appointments with actions: Confirm (PENDING→CONFIRMED), Cancel, Mark Complete.

- [ ] **Step 3: Create ScheduleManager component**

Table showing Mon-Sat with start time, end time, slot duration, active toggle per day. Save button calls `POST/PUT/DELETE /api/doctors/schedules`.

- [ ] **Step 4: Create doctor schedule API endpoints**

```
POST   /api/doctors/schedules      → create
PUT    /api/doctors/schedules/:id  → update
DELETE /api/doctors/schedules/:id  → delete
```

All require authenticate + authorize(DOCTOR).

- [ ] **Step 5: Create doctor profile page**

Edit: title, bio, experience, consultation fee, specialty.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\(dashboard\)/doctor/ apps/web/components/doctor/ apps/api/src/modules/doctors/
git commit -m "feat: add doctor dashboard with appointments, schedule manager, and profile"
```

### Task 24: Staff dashboard

**Files:**
- Create: `apps/web/app/(dashboard)/staff/dashboard/page.tsx`
- Create: `apps/web/app/(dashboard)/staff/appointments/page.tsx`

- [ ] **Step 1: Create staff dashboard page**

Overview of today's appointments for the clinic. Quick actions: confirm/cancel appointments.

- [ ] **Step 2: Create staff appointments page**

List of all appointments for the staff's clinic. Filter by doctor, status, date. Actions: confirm, cancel.

Staff queries need to resolve the clinic from the staff record, then filter appointments by clinicId.

- [ ] **Step 3: Add staff clinic resolution to appointments service**

In the appointments list endpoint, when role=STAFF, look up staff record → get clinicId → filter by clinicId.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/staff/
git commit -m "feat: add staff dashboard with clinic appointment management"
```

---

## Chunk 7: Polish & Integration

### Task 25: Specialties page

**Files:**
- Create: `apps/web/app/(public)/specialties/page.tsx`
- Create: `apps/web/app/(public)/specialties/[slug]/page.tsx`

- [ ] **Step 1: Create specialties listing page**

Grid of all specialties with icons, names, doctor counts.

- [ ] **Step 2: Create specialty detail page**

Shows specialty info + list of doctors in that specialty (using DoctorCard grid).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(public\)/specialties/
git commit -m "feat: add specialties listing and detail pages"
```

### Task 26: Responsive design audit

- [ ] **Step 1: Audit all pages on mobile viewport (375px)**

Check: Header hamburger menu, homepage sections stack vertically, doctor cards single column, booking modal full-width, dashboard sidebar becomes sheet, forms full-width.

- [ ] **Step 2: Fix any responsive issues found**

Common fixes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` patterns, mobile padding adjustments, sheet for sidebar.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "fix: responsive design improvements across all pages"
```

### Task 27: Error handling & loading states

- [ ] **Step 1: Add loading skeletons to all data-fetching pages**

Create `apps/web/components/shared/doctor-card-skeleton.tsx`, `appointment-card-skeleton.tsx`. Use in list pages.

- [ ] **Step 2: Add error boundaries**

Create `apps/web/app/error.tsx` (global error boundary) and `apps/web/app/(dashboard)/error.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/ apps/web/app/error.tsx
git commit -m "feat: add loading skeletons and error boundaries"
```

### Task 28: Environment setup documentation

- [ ] **Step 1: Update .env.example with all required variables**

- [ ] **Step 2: Verify full flow end-to-end**

1. `npm install` at root
2. Set up `.env` with Supabase credentials
3. `cd packages/db && npx prisma db push && npm run db:seed`
4. `npx turbo dev`
5. Open homepage → search doctors → view detail → register → login → book appointment → see in dashboard

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete Phase 1 MVP - booking platform with auth, search, and dashboards"
```
