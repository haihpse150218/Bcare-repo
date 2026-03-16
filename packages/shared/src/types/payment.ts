export enum TransactionStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export interface Payment {
  id: string;
  appointmentId: string;
  userId: string;
  amount: number;
  method: string;
  status: TransactionStatus;
  transactionId: string | null;
  gatewayData: any;
  refundAmount: number | null;
  refundedAt: Date | null;
  refundReason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
}
