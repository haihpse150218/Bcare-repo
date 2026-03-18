import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "BCare - Đặt lịch khám bệnh trực tuyến",
    template: "%s | BCare",
  },
  description:
    "Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam. Tìm bác sĩ, phòng khám và đặt lịch hẹn dễ dàng.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcare.vn"
  ),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} antialiased bg-neutral text-text`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
