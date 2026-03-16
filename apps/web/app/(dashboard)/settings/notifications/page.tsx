import { NotificationPreferences } from "@/components/notifications/notification-preferences";

export default function NotificationSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cài đặt thông báo</h1>
      <NotificationPreferences />
    </div>
  );
}
