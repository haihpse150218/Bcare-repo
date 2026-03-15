import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <FileQuestion className="w-16 h-16 text-text-light mx-auto" />
        <h2 className="text-2xl font-bold">Không tìm thấy trang</h2>
        <p className="text-text-light">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link href="/">
          <Button>Quay lại trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
