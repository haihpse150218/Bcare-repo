export enum NotificationType {
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
  GENERAL = "GENERAL",
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}
