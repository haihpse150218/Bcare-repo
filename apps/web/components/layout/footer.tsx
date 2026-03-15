import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">BCare</h3>
            <p className="text-sm text-text-light">
              Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Dịch vụ</h4>
            <ul className="space-y-2 text-sm text-text-light">
              <li><Link href="/doctors" className="hover:text-primary">Tìm bác sĩ</Link></li>
              <li><Link href="/clinics" className="hover:text-primary">Phòng khám</Link></li>
              <li><Link href="/specialties" className="hover:text-primary">Chuyên khoa</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-text-light">
              <li><Link href="#" className="hover:text-primary">Hướng dẫn đặt lịch</Link></li>
              <li><Link href="#" className="hover:text-primary">Câu hỏi thường gặp</Link></li>
              <li><Link href="#" className="hover:text-primary">Liên hệ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-text-light">
              <li>Email: support@bcare.vn</li>
              <li>Hotline: 1900-xxxx</li>
              <li>TP. Hồ Chí Minh, Việt Nam</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-text-light">
          &copy; {new Date().getFullYear()} BCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
