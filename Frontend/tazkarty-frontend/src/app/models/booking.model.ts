import { Seat } from './seat.model';
import { Show } from './show.model';
import { Venue } from './venue.model';
import { Hall } from './show.model'; // Hall is defined in show.model.ts currently

// Assuming Payment is defined locally or elsewhere, if not I'll define it here or import it.
// Actually Payment was used in CreateBookingResponse.
export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
}

export interface Booking {
  _id: string;
  user_id: string;
  show_id: string | Show;
  seats: string[] | Seat[];
  price_per_seat: number;
  total_price: number;
  status: 'pending' | 'booked' | 'cancelled';
  isPaid: boolean;
  booking_time: Date;
  payment_id?: string;
  promo_code?: string;
  qr_code_url?: string;
}

export interface CreateBookingRequest {
  show_id: string;
  seatIds: string[];
  promoCode?: string;
}

export interface CreateBookingResponse {
  message: string;
  ticket: Booking;
  payment: Payment;
  lock_expires_at: Date;
}

export interface ConfirmBookingRequest {
  ticketId: string;
  transaction_id: string;
}

export type SeatType = 'standard' | 'vip' | 'premium' | 'wheelchair' | 'gap' | 'aisle';

export interface SeatDefinition {
  id: string; // Unique Identifier (e.g., "A-1", "V-12") // Immutable Identity
  label: string; // Display text (e.g., "1", "12")
  type: SeatType;
  status: 'available' | 'maintenance' | 'blocked'; // Physical status

  // Rendering Coordinates (Calculated by Editor, used by Renderer)
  x: number;
  y: number;
}

export interface SeatRow {
  label: string; // "A", "Row 1"
  seats: SeatDefinition[];
}

export interface SeatSection {
  name: string; // "Stalls", "Balcony"
  rows: SeatRow[];
  order: number; // For visualization
}

export interface SeatMapConfig {
  sections: SeatSection[];
  total_capacity: number;
}

