# Phase 4 Polish — Revenue Charts, SEO, Security, Sentry

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add revenue charts with Recharts, SEO optimization (sitemap, robots, structured data, meta tags), security hardening (Helmet headers, input sanitization), and Sentry error tracking to production-ready state.

**Architecture:** Recharts on admin dashboard for revenue visualization. Next.js App Router metadata API for SEO. @fastify/helmet for security headers. @sentry/node + @sentry/nextjs for error tracking. All changes are additive — no existing logic modified.

**Tech Stack:** Recharts, @fastify/helmet, @sentry/node, @sentry/nextjs, Next.js metadata API

---

## File Structure

| File | Purpose |
|------|---------|
| `apps/web/app/(dashboard)/admin/dashboard/page.tsx` | Modify: add Recharts revenue chart |
| `apps/web/app/(dashboard)/admin/dashboard/revenue-chart.tsx` | Create: client component for Recharts |
| `apps/web/app/sitemap.ts` | Create: dynamic sitemap generation |
| `apps/web/app/robots.ts` | Create: robots.txt generation |
| `apps/web/app/(public)/blog/[slug]/page.tsx` | Modify: add generateMetadata for blog SEO |
| `apps/web/app/(public)/blog/page.tsx` | Modify: add metadata export |
| `apps/web/app/(public)/doctors/[slug]/page.tsx` | Modify: add generateMetadata for doctor SEO |
| `apps/web/app/(public)/clinics/[slug]/page.tsx` | Modify: add generateMetadata for clinic SEO |
| `apps/web/app/layout.tsx` | Modify: enhance root metadata, add JSON-LD |
| `apps/api/src/app.ts` | Modify: add @fastify/helmet, tighten rate limit on auth routes |
| `apps/api/src/lib/sentry.ts` | Create: Sentry init for backend |
| `apps/web/sentry.client.config.ts` | Create: Sentry init for frontend client |
| `apps/web/sentry.server.config.ts` | Create: Sentry init for frontend server |
| `apps/web/next.config.ts` | Modify: add Sentry webpack plugin, image domains |
| `apps/web/app/global-error.tsx` | Create: Sentry error boundary |

---

### Task 1: Revenue Charts with Recharts

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/app/(dashboard)/admin/dashboard/revenue-chart.tsx`
- Modify: `apps/web/app/(dashboard)/admin/dashboard/page.tsx`

- [ ] **Step 1: Install recharts**

```bash
cd apps/web && npm install recharts
```

- [ ] **Step 2: Create RevenueChart client component**

Create `apps/web/app/(dashboard)/admin/dashboard/revenue-chart.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface RevenueData {
  labels: string[];
  revenue: number[];
  transactions: number[];
  totalRevenue: number;
  totalTransactions: number;
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<RevenueData>(`/api/admin/reports?period=${period}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const chartData =
    data?.labels.map((label, i) => ({
      name: label,
      revenue: data.revenue[i],
      transactions: data.transactions[i],
    })) ?? [];

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Doanh thu</h3>
          {data && (
            <p className="text-2xl font-bold text-primary">
              {formatVND(data.totalRevenue)}
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-sm ${
                period === p
                  ? "bg-primary text-white"
                  : "hover:bg-neutral-100"
              }`}
            >
              {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] animate-pulse rounded bg-neutral-100" />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis
              fontSize={12}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1_000).toFixed(0)}K`
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === "revenue" ? formatVND(value) : value,
                name === "revenue" ? "Doanh thu" : "Giao dịch",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "revenue" ? "Doanh thu" : "Giao dịch"
              }
            />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add RevenueChart to admin dashboard page**

In `apps/web/app/(dashboard)/admin/dashboard/page.tsx`, import and add `<RevenueChart />` below the stats cards section, above the recent appointments table.

Add import:
```tsx
import { RevenueChart } from "./revenue-chart";
```

Add component after stats grid, before recent appointments:
```tsx
<RevenueChart />
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project apps/web/tsconfig.json
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat: add Recharts revenue chart to admin dashboard"
```

---

### Task 2: SEO — Sitemap, Robots, Meta Tags

**Files:**
- Create: `apps/web/app/sitemap.ts`
- Create: `apps/web/app/robots.ts`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/(public)/blog/[slug]/page.tsx`
- Modify: `apps/web/app/(public)/blog/page.tsx`

- [ ] **Step 1: Create robots.ts**

Create `apps/web/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcare.vn";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/patient/", "/doctor/", "/clinic/", "/staff/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Create sitemap.ts**

Create `apps/web/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcare.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/doctors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/clinics`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/specialties`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/api/posts?limit=1000`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      blogPages = (json.data ?? []).map((post: { slug: string; updatedAt: string }) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {}

  return [...staticPages, ...blogPages];
}
```

- [ ] **Step 3: Enhance root layout metadata**

In `apps/web/app/layout.tsx`, expand the metadata export to include Open Graph, Twitter card, and base site info:

```ts
export const metadata: Metadata = {
  title: {
    default: "BCare - Đặt lịch khám bệnh trực tuyến",
    template: "%s | BCare",
  },
  description:
    "Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam. Tìm bác sĩ, phòng khám và đặt lịch hẹn dễ dàng.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcare.vn"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "BCare",
    title: "BCare - Đặt lịch khám bệnh trực tuyến",
    description: "Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam",
  },
  twitter: {
    card: "summary_large_image",
    title: "BCare - Đặt lịch khám bệnh trực tuyến",
    description: "Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam",
  },
  robots: { index: true, follow: true },
};
```

- [ ] **Step 4: Add generateMetadata to blog post page**

In `apps/web/app/(public)/blog/[slug]/page.tsx`, add a `generateMetadata` function that fetches the post and returns title, description, Open Graph, and JSON-LD structured data (Article schema).

```tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const json = await res.json();
    const post = json.data;
    return {
      title: post.title,
      description: post.metaDescription || post.content?.slice(0, 160),
      openGraph: {
        title: post.title,
        description: post.metaDescription || post.content?.slice(0, 160),
        type: "article",
        publishedTime: post.createdAt,
        modifiedTime: post.updatedAt,
        images: post.metaImage || post.thumbnailUrl ? [{ url: post.metaImage || post.thumbnailUrl }] : [],
      },
    };
  } catch {
    return {};
  }
}
```

- [ ] **Step 5: Add metadata to blog listing page**

In `apps/web/app/(public)/blog/page.tsx`, add:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog sức khỏe",
  description: "Cập nhật tin tức y tế, sức khỏe và chăm sóc sức khỏe mới nhất từ BCare.",
};
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project apps/web/tsconfig.json
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/
git commit -m "feat: add SEO — sitemap, robots.txt, Open Graph, blog metadata"
```

---

### Task 3: Security Hardening — Helmet + Auth Rate Limiting

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Install @fastify/helmet**

```bash
cd apps/api && npm install @fastify/helmet
```

- [ ] **Step 2: Register Helmet in app.ts**

In `apps/api/src/app.ts`, import and register helmet after CORS:

```ts
import helmet from "@fastify/helmet";
```

Register after `app.register(cors, ...)`:

```ts
await app.register(helmet, {
  contentSecurityPolicy: false, // CSP managed by Next.js
});
```

- [ ] **Step 3: Add stricter rate limit for auth routes**

In `apps/api/src/app.ts`, add route-level rate limit config for auth routes. Find where auth routes are registered and add a config override, or add a preHandler on the auth route registration.

In `apps/api/src/modules/auth/auth.routes.ts`, add rate limit config to login and register routes:

```ts
{ config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }
```

This should be added to the route options for `POST /login` and `POST /register`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project apps/api/tsconfig.json
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/
git commit -m "feat: add security hardening — Helmet headers, auth rate limiting"
```

---

### Task 4: Sentry Error Tracking

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Create: `apps/api/src/lib/sentry.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/web/sentry.client.config.ts`
- Create: `apps/web/sentry.server.config.ts`
- Create: `apps/web/app/global-error.tsx`
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Install Sentry packages**

```bash
cd apps/api && npm install @sentry/node
cd ../../apps/web && npm install @sentry/nextjs
```

- [ ] **Step 2: Create backend Sentry init**

Create `apps/api/src/lib/sentry.ts`:

```ts
import * as Sentry from "@sentry/node";

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  });
}

export { Sentry };
```

- [ ] **Step 3: Integrate Sentry in API app**

In `apps/api/src/app.ts`, import and call `initSentry()` at the top of `buildApp()`. Add a global error handler that captures exceptions:

```ts
import { initSentry, Sentry } from "./lib/sentry.js";
```

At start of `buildApp()`:
```ts
initSentry();
```

Add after all route registrations:
```ts
app.setErrorHandler((error, request, reply) => {
  Sentry.captureException(error);
  request.log.error(error);
  reply.status(error.statusCode ?? 500).send({
    success: false,
    error: { code: "INTERNAL_ERROR", message: error.message },
  });
});
```

- [ ] **Step 4: Create frontend Sentry configs**

Create `apps/web/sentry.client.config.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

Create `apps/web/sentry.server.config.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
  });
}
```

- [ ] **Step 5: Create global error boundary**

Create `apps/web/app/global-error.tsx`:

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">Đã xảy ra lỗi</h2>
            <p className="mb-4 text-neutral-600">Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.</p>
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Update next.config.ts with Sentry**

In `apps/web/next.config.ts`, wrap with `withSentryConfig`:

```ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: "../.." },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
```

- [ ] **Step 7: Verify both projects compile**

```bash
npx tsc --noEmit --project apps/api/tsconfig.json
npx tsc --noEmit --project apps/web/tsconfig.json
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/ apps/web/
git commit -m "feat: add Sentry error tracking for API and frontend"
```

---

### Task 5: Next.js Image Optimization + Production Config

**Files:**
- Modify: `apps/web/next.config.ts` (already modified in Task 4, extend further if needed)

> Note: Image `remotePatterns` already added in Task 4. This task only applies if additional production config is needed beyond what Task 4 covers. If Task 4 already includes image config, skip this task and go directly to final commit.

- [ ] **Step 1: Verify all changes compile and commit final state**

```bash
npx tsc --noEmit --project apps/api/tsconfig.json
npx tsc --noEmit --project apps/web/tsconfig.json
```

If all passes, the Phase 4 polish is complete.
