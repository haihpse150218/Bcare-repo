# BCare Phase 3A — Medical Records + Clinic Dashboard Design Spec

**Date:** 2026-03-16
**Phase:** 3A of 4 (Phase 3 split: 3A = Records + Clinic, 3B = Chat + Telemedicine)
**Branch:** `feat/phase3a-records-clinic`
**Depends on:** Phase 2 (Payment + Reviews) complete on `feat/phase1-mvp`

---

## Overview

Phase 3A adds patient medical records (hybrid: appointment notes + patient health profile), clinic management dashboard with statistics/charts/export, and file attachments via Supabase Storage.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Medical records model | Hybrid — appointment notes + patient profile | Captures per-visit data and ongoing health info |
| Access control | Doctor (with appointment) + Staff can view; Patient read-only own data | Privacy-first, doctor ghi Patient xem |
| File storage | Supabase Storage with signed URLs | Already in stack, secure, scalable |
| Clinic stats | Charts (Recharts) + export (CSV/PDF) | Full analytics per spec |
| Architecture | 2 separate modules (medical-records + clinic-management) | Clean separation, follows existing patterns |

---

## 1. Database Schema Changes

### New: `PatientProfile` model

```prisma
model PatientProfile {
  id          String   @id @default(uuid())
  patientId   String   @unique @map("patient_id")
  bloodType   String?  @map("blood_type")
  allergies   String[] @default([])
  conditions  String[] @default([])
  medications String[] @default([])
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  patient User @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@map("patient_profiles")
}
```

### New: `MedicalNote` model

```prisma
model MedicalNote {
  id            String    @id @default(uuid())
  appointmentId String    @unique @map("appointment_id")
  doctorId      String    @map("doctor_id")
  patientId     String    @map("patient_id")
  diagnosis     String
  prescription  String?
  notes         String?
  followUpDate  DateTime? @map("follow_up_date")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  appointment  Appointment        @relation(fields: [appointmentId], references: [id])
  doctor       Doctor             @relation(fields: [doctorId], references: [id])
  patient      User               @relation("PatientMedicalNotes", fields: [patientId], references: [id])
  attachments  MedicalAttachment[]

  @@map("medical_notes")
}
```

### New: `MedicalAttachment` model

```prisma
model MedicalAttachment {
  id        String   @id @default(uuid())
  noteId    String   @map("note_id")
  fileName  String   @map("file_name")
  fileUrl   String   @map("file_url")
  fileType  String   @map("file_type")
  fileSize  Int      @map("file_size")
  createdAt DateTime @default(now()) @map("created_at")

  note MedicalNote @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@map("medical_attachments")
}
```

### Relations on existing models

Add to `User`:
```prisma
patientProfile  PatientProfile?
medicalNotes    MedicalNote[]    @relation("PatientMedicalNotes")
```

Add to `Appointment`:
```prisma
medicalNote MedicalNote?
```

Add to `Doctor`:
```prisma
medicalNotes MedicalNote[]
```

---

## 2. Medical Records API

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/patients/:id/profile` | Doctor (has appointment with patient), Staff | View patient profile |
| GET | `/api/patients/my-profile` | Patient | View own profile |
| PUT | `/api/patients/my-profile` | Patient | Update own profile |
| POST | `/api/medical-notes` | Doctor | Create note for appointment |
| PUT | `/api/medical-notes/:id` | Doctor (author) | Update note |
| GET | `/api/medical-notes/appointment/:appointmentId` | Doctor, Patient (own) | View note by appointment |
| GET | `/api/medical-notes/patient/:patientId` | Doctor (has appointment), Staff | Patient's note history |
| GET | `/api/my-medical-notes` | Patient | View all own notes |
| POST | `/api/medical-notes/:id/attachments` | Doctor (author) | Upload file attachment |
| DELETE | `/api/medical-notes/:id/attachments/:attachmentId` | Doctor (author) | Delete attachment |

### Business Rules

1. **Create note**: only when `appointment.status` is COMPLETED or IN_PROGRESS
2. **One note per appointment**: unique constraint on `appointmentId`
3. **Doctor access to patient profile**: requires at least 1 non-CANCELLED appointment with that patient
4. **File upload limits**: max 10MB per file, allowed types: image/jpeg, image/png, application/pdf, max 5 files per note
5. **Patient access**: read-only for all notes and own profile; can update profile fields (bloodType, allergies, conditions, medications, notes)

### Validation Schemas

```typescript
const createMedicalNoteSchema = z.object({
  appointmentId: z.string().uuid(),
  diagnosis: z.string().min(1).max(2000),
  prescription: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  followUpDate: z.string().datetime().optional(),
});

const updateMedicalNoteSchema = z.object({
  diagnosis: z.string().min(1).max(2000).optional(),
  prescription: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  followUpDate: z.string().datetime().nullable().optional(),
});

const updatePatientProfileSchema = z.object({
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  allergies: z.array(z.string().max(100)).max(20).optional(),
  conditions: z.array(z.string().max(100)).max(20).optional(),
  medications: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(1000).optional(),
});
```

### Supabase Storage

- Bucket: `medical-attachments` (private)
- Path pattern: `{patientId}/{noteId}/{filename}`
- Access via signed URLs (1 hour expiry)
- Upload flow: Fastify receives multipart → validates → uploads to Supabase Storage → saves URL in `MedicalAttachment`

---

## 3. Clinic Dashboard

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clinics/my` | Clinic owner | Get own clinic info |
| PUT | `/api/clinics/my` | Clinic owner | Update clinic profile |
| GET | `/api/clinics/my/doctors` | Clinic owner, Staff | List clinic doctors |
| POST | `/api/clinics/my/doctors` | Clinic owner | Add doctor to clinic |
| DELETE | `/api/clinics/my/doctors/:doctorId` | Clinic owner | Remove doctor |
| GET | `/api/clinics/my/staff` | Clinic owner | List clinic staff |
| POST | `/api/clinics/my/staff` | Clinic owner | Add staff member |
| DELETE | `/api/clinics/my/staff/:staffId` | Clinic owner | Remove staff |
| GET | `/api/clinics/my/stats` | Clinic owner, Staff | Summary statistics |
| GET | `/api/clinics/my/stats/chart` | Clinic owner, Staff | Chart data (time series) |
| GET | `/api/clinics/my/stats/export` | Clinic owner | Export CSV or PDF |

### Stats Response Shapes

```typescript
// GET /api/clinics/my/stats
interface ClinicStats {
  totalAppointments: number;
  totalRevenue: number;
  totalDoctors: number;
  totalPatients: number;
  completionRate: number; // percentage
  topDoctors: {
    name: string;
    appointments: number;
    revenue: number;
  }[];
}

// GET /api/clinics/my/stats/chart?period=week|month|year
interface ChartData {
  labels: string[];
  appointments: number[];
  revenue: number[];
}

// GET /api/clinics/my/stats/export?format=csv|pdf&from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns file stream (Content-Disposition: attachment)
```

### Clinic Management Business Rules

1. **Clinic owner** = User with role CLINIC who owns the clinic
2. **Add doctor**: by email — user must exist with role DOCTOR and not belong to another clinic
3. **Add staff**: by email — user must exist with role STAFF
4. **Remove doctor/staff**: soft removal (set `clinicId` to null), don't delete user
5. **Stats queries**: filter by clinic's appointments, aggregate revenue from appointment.amount where paymentStatus = PAID
6. **Export date range**: default last 30 days, max 1 year

### Export Formats

- **CSV** (`json2csv`): columns — Date, Doctor, Patient, Status, Amount, Payment Status
- **PDF** (`pdfkit`): BCare header, clinic name, date range, summary stats table, appointment detail table

---

## 4. Frontend Pages & Components

### Patient Pages

| Page | Description |
|------|-------------|
| `/patient/medical-records` | List all medical notes with diagnosis, doctor, date |
| `/patient/profile/medical` | Edit profile: blood type, allergies, conditions, medications |

### Doctor Pages

| Page | Description |
|------|-------------|
| `/doctor/appointments/[id]/notes` | Create/edit medical note for completed appointment |
| `/doctor/patients/[id]` | View patient profile + note history |

### Clinic Pages

| Page | Description |
|------|-------------|
| `/clinic/dashboard` | Stats cards + Recharts charts |
| `/clinic/profile` | Edit clinic info, images, operating hours |
| `/clinic/doctors` | List, add, remove doctors |
| `/clinic/staff` | List, add, remove staff |
| `/clinic/reports` | Export with date range + format picker |

### Components

| Component | Description |
|-----------|-------------|
| `MedicalNoteForm` | Diagnosis (required), prescription, notes, follow-up date, file upload |
| `MedicalNoteCard` | Display note: date, doctor, diagnosis, prescription, attachments |
| `PatientProfileForm` | Blood type select, tag inputs for allergies/conditions/medications |
| `PatientProfileView` | Read-only badges display for doctor view |
| `FileUploadZone` | Drag & drop + click, preview images, show PDFs as file names |
| `AttachmentList` | File list with download signed URL links |
| `StatsCard` | Number + label + trend indicator |
| `AppointmentChart` | Line chart — appointments over time (Recharts) |
| `RevenueChart` | Bar chart — revenue over time (Recharts) |
| `StatusPieChart` | Pie chart — appointment status distribution |
| `TopDoctorsTable` | Ranked table — doctor name, appointments, revenue |
| `ExportForm` | Date range picker + format select (CSV/PDF) + download button |
| `DoctorManager` | List doctors + add by email form + remove button |
| `StaffManager` | List staff + add by email form + remove button |
| `ClinicProfileEditor` | Edit form: name, address, phone, description, operating hours JSON editor, images |

---

## 5. New Dependencies

### Backend (`apps/api`)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "json2csv": "^6.0.0",
    "pdfkit": "^0.15.0",
    "@fastify/multipart": "^8.0.0"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.0"
  }
}
```

### Frontend (`apps/web`)

```json
{
  "dependencies": {
    "recharts": "^2.12.0"
  }
}
```

### Environment Variables

Add to `.env.example`:
```env
# Supabase Storage
STORAGE_BUCKET=medical-attachments
```

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` already exist in `.env.example` from Phase 1.

---

## 6. Dashboard Navigation Updates

Add to sidebar navigation by role:

**CLINIC role:**
- `/clinic/dashboard` — "Tổng quan" (BarChart3 icon)
- `/clinic/profile` — "Hồ sơ phòng khám" (Building icon)
- `/clinic/doctors` — "Quản lý bác sĩ" (UserPlus icon)
- `/clinic/staff` — "Quản lý nhân viên" (Users icon)
- `/clinic/reports` — "Báo cáo" (FileDown icon)

**PATIENT role (add to existing):**
- `/patient/medical-records` — "Hồ sơ bệnh án" (FileText icon)
- `/patient/profile/medical` — "Thông tin sức khỏe" (Heart icon)

**DOCTOR role (in appointment detail):**
- Link "Ghi chú khám" on completed/in-progress appointments → `/doctor/appointments/[id]/notes`
