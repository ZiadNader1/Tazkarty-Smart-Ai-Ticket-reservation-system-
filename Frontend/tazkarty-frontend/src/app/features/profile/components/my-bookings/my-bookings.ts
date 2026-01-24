// =====================================================
// FILE: src/app/features/profile/components/my-bookings/my-bookings.ts
// My Bookings with QR Codes
// =====================================================

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../models/booking.model';
import { Show } from '../../../../models/show.model';
import { Event } from '../../../../models/event.model';
import { LanguageService } from '../../../../core/services/language.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent],
  templateUrl: './my-bookings.html',
  styles: []
})
export class MyBookings implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  activeTab = signal<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  selectedBooking = signal<Booking | null>(null);

  tabs = [
    { value: 'all' as const, label: 'profile.tabs.all', icon: '📋' },
    { value: 'upcoming' as const, label: 'profile.tabs.upcoming', icon: '📅' },
    { value: 'past' as const, label: 'profile.tabs.past', icon: '🕐' },
    { value: 'cancelled' as const, label: 'profile.tabs.cancelled', icon: '❌' }
  ];

  constructor(
    private bookingService: BookingService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (response) => {
        this.bookings.set(response.tickets);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading.set(false);
      }
    });
  }

  filteredBookings = computed(() => {
    const all = this.bookings();
    const tab = this.activeTab();

    if (tab === 'all') return all;

    if (tab === 'cancelled') {
      return all.filter(b => b.status === 'cancelled');
    }

    const now = new Date();
    const confirmed = all.filter(b => b.status === 'booked');

    if (tab === 'upcoming') {
      return confirmed.filter(b => {
        const showDate = this.getShowDate(b);
        return showDate && new Date(showDate) > now;
      });
    }

    if (tab === 'past') {
      return confirmed.filter(b => {
        const showDate = this.getShowDate(b);
        return showDate && new Date(showDate) <= now;
      });
    }

    return all;
  });

  getTabCount(tab: string): number {
    if (tab === 'all') return this.bookings().length;
    if (tab === 'cancelled') return this.bookings().filter(b => b.status === 'cancelled').length;

    const now = new Date();
    const confirmed = this.bookings().filter(b => b.status === 'booked');

    if (tab === 'upcoming') {
      return confirmed.filter(b => {
        const showDate = this.getShowDate(b);
        return showDate && new Date(showDate) > now;
      }).length;
    }

    if (tab === 'past') {
      return confirmed.filter(b => {
        const showDate = this.getShowDate(b);
        return showDate && new Date(showDate) <= now;
      }).length;
    }

    return 0;
  }

  getEventTitle(booking: Booking): string {
    if ((booking as any).isTrain) {
      const b = booking as any;
      return `${this.langService.translate(b.departure_city)} ${this.langService.translate('profile.to')} ${this.langService.translate(b.destination_city)} (${this.langService.translate('nav.trains')} #${b.train_number})`;
    }

    if (typeof booking.show_id === 'object' && booking.show_id) {
      const show = booking.show_id as any;

      // 1. Check if it's a Sports Event with Teams
      if (typeof show.event_id === 'object') {
        const evt = show.event_id as any;
        if (evt.home_team && evt.away_team) {
          return `${this.langService.translate(evt.home_team)} vs ${this.langService.translate(evt.away_team)}`;
        }
      }

      // 2. Prefer Show Title if explicit (e.g. CairoKee)
      if (show.title && show.title !== 'Event') return show.title;

      // 3. Fallback to Event Title
      if (typeof show.event_id === 'object') {
        const evt = show.event_id as any;
        return this.langService.translate(evt.title) || this.langService.translate('common.general');
      }
    }
    return this.langService.translate('common.general');
  }

  getEventPoster(booking: Booking): string {
    if ((booking as any).isTrain) {
      return `${environment.uploadsUrl}/R.png`; // Using R.png from uploads
    }

    let url = '';
    if (typeof booking.show_id === 'object' && booking.show_id) {
      const show = booking.show_id as any;
      if (show.poster_url) {
        url = show.poster_url;
      } else if (typeof show.event_id === 'object') {
        const evt = show.event_id as any;
        url = evt.poster_url || '';
      }
    }

    // Fix for relative paths (local uploads)
    if (url && !url.startsWith('http')) {
      // If it starts with 'uploads/', it already has the folder
      const path = url.startsWith('uploads/') ? url.replace('uploads/', '') : url;
      return `${environment.uploadsUrl}/${path.replace(/\\/g, '/')}`;
    }

    return url;
  }

  getShowDate(booking: Booking): Date | null {
    if ((booking as any).isTrain) {
      return (booking as any).travel_date || null;
    }
    if (typeof booking.show_id === 'object' && booking.show_id) {
      return (booking.show_id as any).start_time || null;
    }
    return null;
  }

  getBookingDate(booking: Booking): Date {
    return (booking as any).createdAt || new Date();
  }

  isTrainBooking(booking: Booking): boolean {
    return !!(booking as any).isTrain;
  }

  getSeatNumbers(booking: Booking): string {
    if ((booking as any).isTrain) {
      const seats = (booking as any).seats;
      if (Array.isArray(seats) && seats.length > 0) {
        return seats.map((s: any) => `${this.langService.translate('trains.carriage')} ${s.carriage_number} - ${this.langService.translate('trains.seat')} ${s.seat_label}`).join(', ');
      }
    }
    if (Array.isArray(booking.seats) && booking.seats.length > 0) {
      // Try to show actual labels
      const firstSeat = booking.seats[0] as any;
      if (typeof firstSeat === 'object') {
        if (firstSeat.row_label && firstSeat.seat_label) {
          if (booking.seats.length === 1) return `${firstSeat.row_label}${firstSeat.seat_label}`;
          return `${booking.seats.length} ${this.langService.translate('profile.seats')} (${firstSeat.row_label}...)`;
        }
      }
      return `${booking.seats.length} ${this.langService.translate('profile.seats')}`;
    }
    return this.langService.translate('common.unavailable');
  }

  showQRCode(booking: Booking): void {
    this.selectedBooking.set(booking);
  }

  closeQRModal(): void {
    this.selectedBooking.set(null);
  }

  continuePayment(booking: Booking): void {
    // Navigate to payment page
    window.location.href = `/booking/payment/${booking._id}`;
  }

  downloadTicket(booking: Booking): void {
    // TODO: Implement ticket download
    alert(this.langService.translate('booking.ticket_downloaded'));
  }

  cancelBooking(booking: Booking): void {
    const isRefund = booking.status === 'booked';
    const message = isRefund
      ? this.langService.translate('profile.refund_policy')
      : this.langService.translate('profile.cancel_confirm');

    if (confirm(message)) {
      this.bookingService.cancelBooking(booking._id).subscribe({
        next: () => {
          alert(this.langService.translate('profile.cancel_success'));
          this.loadBookings();
        },
        error: (err) => {
          console.error('Error cancelling booking:', err);
          alert(this.langService.translate('profile.cancel_failed'));
        }
      });
    }
  }

  deleteBooking(booking: Booking): void {
    if (confirm(this.langService.translate('profile.delete_confirm'))) {
      this.bookingService.deleteBooking(booking._id).subscribe({
        next: () => {
          this.loadBookings();
        },
        error: (err) => {
          console.error('Error deleting booking:', err);
        }
      });
    }
  }
}