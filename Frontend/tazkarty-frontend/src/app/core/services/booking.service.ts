import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Booking,
  CreateBookingRequest,
  CreateBookingResponse,
  ConfirmBookingRequest
} from '../../models/booking.model';
import { AvailableSeatsResponse } from '../../models/seat.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // Current booking state
  currentBooking = signal<Booking | null>(null);
  selectedSeats = signal<string[]>([]);
  lockExpiresAt = signal<Date | null>(null);

  constructor(private api: ApiService) { }

  /**
   * Step 1: Create booking (lock seats)
   */
  createBooking(request: CreateBookingRequest): Observable<CreateBookingResponse> {
    return this.api.post<CreateBookingResponse>('bookings', request)
      .pipe(
        tap(response => {
          this.currentBooking.set(response.ticket);
          this.lockExpiresAt.set(new Date(response.lock_expires_at));
        })
      );
  }

  /**
   * Step 2: Confirm booking after payment
   */
  confirmBooking(request: ConfirmBookingRequest): Observable<any> {
    return this.api.post('bookings/confirm', request)
      .pipe(
        tap(() => {
          this.clearBookingState();
        })
      );
  }

  /**
   * Cancel booking
   */
  cancelBooking(ticketId: string): Observable<any> {
    return this.api.post('bookings/cancel', { ticketId })
      .pipe(
        tap(() => {
          this.clearBookingState();
        })
      );
  }

  deleteBooking(ticketId: string): Observable<any> {
    return this.api.delete(`bookings/${ticketId}`);
  }

  /**
   * Get user bookings
   */
  getMyBookings(): Observable<{ count: number; tickets: Booking[] }> {
    return this.api.get('bookings/mine');
  }

  /**
   * Get booking by ID
   */
  getBookingById(id: string): Observable<Booking> {
    return this.api.get<Booking>(`bookings/${id}`);
  }

  /**
   * Get available seats for a show
   */
  getAvailableSeats(showId: string): Observable<AvailableSeatsResponse> {
    return this.api.get(`bookings/available/${showId}`);
  }

  /**
   * Get show details
   */
  /**
   * Get show details
   */
  getShowById(showId: string): Observable<any> {
    return this.api.get(`shows/${showId}`);
  }

  getHallConfig(hallId: string): Observable<any> {
    return this.api.get(`halls/${hallId}`);
  }

  /**
   * Clear booking state
   */
  private clearBookingState(): void {
    this.currentBooking.set(null);
    this.selectedSeats.set([]);
    this.lockExpiresAt.set(null);
  }

  /**
   * Get remaining lock time in seconds
   */
  getRemainingLockTime(): number {
    const expiresAt = this.lockExpiresAt();
    if (!expiresAt) return 0;

    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expires - now) / 1000));

    return remaining;
  }
}
