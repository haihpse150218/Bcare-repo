# BCare — Medical Appointment Booking Platform

Nền tảng đặt lịch khám bệnh trực tuyến. Bệnh nhân tìm bác sĩ, xem phòng khám và đặt lịch hẹn. Dashboard cho bệnh nhân, bác sĩ và nhân viên.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Fastify, Prisma ORM
- **Database:** PostgreSQL 16
- **Monorepo:** Turborepo + npm workspaces

## Cấu trúc dự án

```
bcare/
├── apps/
│   ├── api/          # Fastify API server (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── db/           # Prisma schema + seed data
│   └── shared/       # Shared types & utilities
├── docker-compose.yml
└── package.json
```

## Chạy với Docker (khuyến nghị)

Chỉ cần Docker, không cần cài Node.js hay PostgreSQL.

```bash
# Khởi động toàn bộ (PostgreSQL + API + Web)
docker compose up -d

# Xem logs
docker compose logs -f

# Dừng
docker compose down

# Dừng + xóa dữ liệu database
docker compose down -v
```

Sau khi chạy, mở:
- **Web:** http://localhost:3000
- **API:** http://localhost:3001

## Chạy local (development)

### Yêu cầu

- Node.js >= 22
- PostgreSQL 16 (hoặc dùng Docker cho DB)

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo database

**Dùng Docker:**

```bash
docker run -d --name bcare-postgres \
  -e POSTGRES_USER=bcare \
  -e POSTGRES_PASSWORD=bcare_dev_2026 \
  -e POSTGRES_DB=bcare \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Cấu hình environment

Tạo file `.env` ở thư mục gốc:

```env
DATABASE_URL="postgresql://bcare:bcare_dev_2026@localhost:5432/bcare"
DIRECT_URL="postgresql://bcare:bcare_dev_2026@localhost:5432/bcare"

JWT_SECRET="bcare-dev-jwt-secret-32chars-min!!"
JWT_REFRESH_SECRET="bcare-dev-refresh-secret-32chars!!"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
PORT=3001
```

Tạo file `packages/db/.env`:

```env
DATABASE_URL="postgresql://bcare:bcare_dev_2026@localhost:5432/bcare"
DIRECT_URL="postgresql://bcare:bcare_dev_2026@localhost:5432/bcare"
```

### 4. Khởi tạo database

```bash
cd packages/db
npx prisma db push       # Đồng bộ schema
npx tsx prisma/seed.ts    # Thêm dữ liệu mẫu
```

### 5. Chạy ứng dụng

```bash
npm run dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001/api/health

## Tài khoản test

| Vai trò  | Email              | Mật khẩu        |
|----------|--------------------|------------------|
| Bệnh nhân | patient@bcare.vn  | Patient@123456  |
| Bác sĩ   | doctor1@bcare.vn   | Doctor@123456   |
| Nhân viên | staff@bcare.vn     | Staff@123456    |
| Admin    | admin@bcare.vn      | Admin@123456    |

## API Endpoints

| Method | Endpoint                | Mô tả                   |
|--------|-------------------------|--------------------------|
| GET    | /api/health             | Health check             |
| POST   | /api/auth/register      | Đăng ký                  |
| POST   | /api/auth/login         | Đăng nhập                |
| POST   | /api/auth/refresh       | Refresh token            |
| GET    | /api/auth/me            | Thông tin user           |
| GET    | /api/specialties        | Danh sách chuyên khoa    |
| GET    | /api/doctors            | Danh sách bác sĩ         |
| GET    | /api/doctors/:slug      | Chi tiết bác sĩ          |
| GET    | /api/clinics            | Danh sách phòng khám     |
| GET    | /api/clinics/:slug      | Chi tiết phòng khám      |
| GET    | /api/doctors/:id/slots  | Slot khả dụng            |
| POST   | /api/appointments       | Đặt lịch hẹn             |
| GET    | /api/appointments       | Lịch hẹn của user        |
| GET    | /api/notifications      | Thông báo                |
| GET    | /api/schedules          | Lịch làm việc bác sĩ     |
