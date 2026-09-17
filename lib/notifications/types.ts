export type NotificationChannel = "SMS" | "EMAIL" | "WHATSAPP";

export interface NotificationRecipient {
  phone?: string;
  email?: string;
  name: string;
}

export interface SendMessageOptions {
  recipient: NotificationRecipient;
  channel: NotificationChannel;
  template: string;
  params: Record<string, string | number>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  name: string;
  supports(channel: NotificationChannel): boolean;
  send(options: SendMessageOptions): Promise<SendResult>;
}

export interface BookingNotificationData {
  bookingReference: string;
  serviceTitleHi: string;
  serviceTitleEn: string;
  slotTime: string;
  bookingDate: string;
  numberOfDevotees: number;
  primaryDevoteeName: string;
  primaryDevoteePhone: string;
  ticketUrl: string;
}

export interface PaymentNotificationData {
  paymentReference: string;
  amountInRupees: number;
  devoteeName: string;
  devoteePhone: string;
  receiptNumber?: string;
}

export interface DonationNotificationData {
  donationReference: string;
  amountInRupees: number;
  donorName: string;
  donorPhone: string;
  causeTitle: string;
  receiptNumber?: string;
}
