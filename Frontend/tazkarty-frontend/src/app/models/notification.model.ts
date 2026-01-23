export interface Notification {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  type?: 'booking_confirmed' | 'payment_success' | 'payment_failed' | 'reminder' | 'general';
  is_read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocketNotification {
  title: string;
  message: string;
  type: string;
  timestamp: Date;
  read: boolean;
  ticket_id?: string;
  payment_id?: string;
}