// This model represents the "Runtime Status" of a seat for a specific Show.
// It maps back to the Venue's SeatDefinition via `seat_number` or logical ID.

export interface Seat {
  _id?: string; // DB ID if applicable
  seat_id: string; // "A-1" (Matches SeatDefinition.id)
  row_label: string; // "A"
  seat_label: string; // "1"
  section_id?: string; // "Stalls"

  status: 'available' | 'locked' | 'booked' | 'sold' | 'unavailable';
  type: string; // 'standard', 'vip' matches SeatDefinition
  price: number; // Calculated price for this show

  locked_by?: string;
  locked_until?: Date;
}

export interface SeatSelectionRequest {
  showId: string;
  seatIds: string[]; // List of seat_id ("A-1")
}

export interface AvailableSeatsResponse {
  show_id: string;
  available_count: number;
  seats: Seat[]; // List of statuses
}