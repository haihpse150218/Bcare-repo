# BCare Phase 3B — Chat + Telemedicine Design Spec

**Date:** 2026-03-17
**Phase:** 3B of 4
**Branch:** `feat/phase1-mvp`
**Depends on:** Phase 3A complete

---

## Overview

Phase 3B adds realtime chat between patients and doctors (linked to appointments), file/image sharing in chat via Supabase Storage, and video call integration using Agora SDK.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chat transport | Fastify WebSocket (`@fastify/websocket`) | Single realtime layer, already in stack |
| Message persistence | PostgreSQL via Prisma | Consistent with rest of stack |
| File upload in chat | Supabase Storage | Already configured for medical attachments |
| Video call | Agora.io SDK | P2P, low latency, well-documented |
| Conversation model | 1 conversation per patient-doctor pair | Simple, avoids duplicate conversations |

---

## 1. Database Schema

### New: `Conversation` model

```prisma
model Conversation {
  id        String   @id @default(uuid())
  patientId String   @map("patient_id")
  doctorId  String   @map("doctor_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  patient  User      @relation("PatientConversations", fields: [patientId], references: [id])
  doctor   Doctor    @relation(fields: [doctorId], references: [id])
  messages Message[]

  @@unique([patientId, doctorId])
  @@map("conversations")
}
```

### New: `Message` model

```prisma
enum MessageType {
  TEXT
  IMAGE
  FILE
  VIDEO_CALL
}

model Message {
  id             String      @id @default(uuid())
  conversationId String      @map("conversation_id")
  senderId       String      @map("sender_id")
  content        String
  type           MessageType @default(TEXT)
  fileUrl        String?     @map("file_url")
  fileName       String?     @map("file_name")
  fileSize       Int?        @map("file_size")
  createdAt      DateTime    @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation("SentMessages", fields: [senderId], references: [id])

  @@index([conversationId])
  @@map("messages")
}
```

### Relations on existing models

Add to `User`:
```prisma
patientConversations Conversation[] @relation("PatientConversations")
sentMessages         Message[]      @relation("SentMessages")
```

Add to `Doctor`:
```prisma
conversations Conversation[]
```

---

## 2. Chat API (REST)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/conversations` | Patient, Doctor | Create or get existing conversation |
| GET | `/api/conversations` | Patient, Doctor | List my conversations |
| GET | `/api/conversations/:id/messages` | Participant | Get messages (paginated, `?page=1&limit=50`) |
| POST | `/api/conversations/:id/messages` | Participant | Send message (REST fallback) |

### Business Rules

1. **Create conversation**: Patient provides `doctorId`, or Doctor provides `patientId`. Must have at least 1 non-cancelled appointment together.
2. **Access**: Only the patient and doctor in the conversation can access it.
3. **Message send**: validates content (max 2000 chars), optional file attachment.

### Validation Schemas

```typescript
const createConversationSchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
}).refine(data => data.doctorId || data.patientId, { message: "doctorId or patientId required" });

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["TEXT", "IMAGE", "FILE"]).default("TEXT"),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
});
```

---

## 3. WebSocket Chat

### Connection
- Endpoint: `/ws/chat`
- Auth: token passed as query param `?token=xxx`
- On connect: verify JWT, store connection in memory map `userId -> ws`

### Messages (client → server)

```json
{ "type": "message", "conversationId": "uuid", "content": "hello", "messageType": "TEXT" }
{ "type": "typing", "conversationId": "uuid" }
```

### Messages (server → client)

```json
{ "type": "message", "data": { "id": "uuid", "conversationId": "uuid", "senderId": "uuid", "content": "hello", "type": "TEXT", "createdAt": "..." } }
{ "type": "typing", "conversationId": "uuid", "senderId": "uuid" }
{ "type": "online", "userId": "uuid", "online": true }
```

### Implementation
- In-memory connection map (single-server for MVP)
- On message received: persist to DB → broadcast to other participant
- Typing indicator: forward to other participant (no persistence)
- Online status: broadcast on connect/disconnect

---

## 4. Video Call (Agora)

### API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/video-call/token` | Doctor, Patient | Generate Agora RTC token |

### Flow
1. Doctor clicks "Gọi video" → POST `/api/video-call/token` with `{ conversationId }`
2. Server generates Agora token with channel = conversationId
3. Server sends WebSocket message to patient: `{ type: "video_call", action: "incoming", conversationId, callerName }`
4. Patient accepts → POST `/api/video-call/token` with same conversationId
5. Both join Agora channel
6. On hang up → WebSocket message `{ type: "video_call", action: "ended" }`

### Environment Variables
```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

---

## 5. Frontend Pages

| Page | Description |
|------|-------------|
| `/patient/messages` | Conversation list + chat view |
| `/doctor/messages` | Conversation list + chat view |

### Components

| Component | Description |
|-----------|-------------|
| `ConversationList` | List of conversations with last message preview |
| `ChatWindow` | Messages display + input + file upload |
| `MessageBubble` | Individual message (text/image/file) |
| `VideoCallModal` | Incoming call UI + in-call controls |
| `TypingIndicator` | "đang nhập..." dots animation |

---

## 6. New Dependencies

### Backend
```json
{
  "@fastify/websocket": "^10.0.0",
  "agora-token": "^2.0.0"
}
```

### Frontend
```json
{
  "agora-rtc-sdk-ng": "^4.20.0"
}
```

---

## 7. Navigation Updates

**PATIENT role (add):**
- `/patient/messages` — "Tin nhắn" (MessageCircle icon)

**DOCTOR role (add):**
- `/doctor/messages` — "Tin nhắn" (MessageCircle icon)
