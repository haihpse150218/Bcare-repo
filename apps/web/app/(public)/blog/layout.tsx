import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog sức khỏe",
  description:
    "Cập nhật tin tức y tế, sức khỏe và chăm sóc sức khỏe mới nhất từ BCare.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
