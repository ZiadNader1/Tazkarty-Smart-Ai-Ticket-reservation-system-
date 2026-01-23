import { Booking } from './booking.model';

export interface Payment {
  _id: string;
  user_id: string;
  ticket_id: string;
  amount: number;
  method: 'stripe' | 'paypal' | 'wallet' | 'cash' | 'pending';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transaction_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSessionRequest {
  ticketId: string;
}

export interface PaymentSessionResponse {
  clientSecret: string;
  payment: Payment;
  ticket: Booking;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface ConfirmPaymentResponse {
  message: string;
  ticket: Booking;
  payment: Payment;
  qr_code_url: string;
}