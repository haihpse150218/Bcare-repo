import { PaymentHistory } from "@/components/payments/payment-history";

export default function PatientPaymentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lịch sử thanh toán</h1>
      <PaymentHistory />
    </div>
  );
}
