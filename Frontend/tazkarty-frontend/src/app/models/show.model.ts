import { Event } from './event.model';
import { Venue } from './venue.model';

export interface Show {
  _id: string;
  event_id?: string | Event; // Now optional
  title?: string; // New field
  hall_id: string | Hall;
  start_time: Date;
  end_time: Date;
  price: number;
  available_seats?: number;
  total_seats?: number;
  is_active?: boolean;
  poster_url?: string; // New
  description?: string; // Optional description
  createdAt: Date;
  updatedAt: Date;
}

export interface Hall {
  _id: string;
  venue_id: string | Venue;
  name: string;
  total_rows: number;
  total_columns: number;
  capacity: number;
  seat_categories?: any[];
  description?: string;
  seat_map_config?: any;
}
