import { Search, CalendarCheck, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: <Search className="w-10 h-10 text-primary" />,
    title: "Tìm bác sĩ",
    description: "Tìm kiếm bác sĩ theo chuyên khoa, vị trí hoặc tên.",
  },
  {
    icon: <CalendarCheck className="w-10 h-10 text-primary" />,
    title: "Chọn giờ khám",
    description: "Chọn ngày và khung giờ phù hợp với lịch của bạn.",
  },
  {
    icon: <CheckCircle className="w-10 h-10 text-primary" />,
    title: "Xác nhận lịch hẹn",
    description: "Xác nhận đặt lịch và nhận thông báo nhắc nhở.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">Cách đặt lịch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-text-light">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
