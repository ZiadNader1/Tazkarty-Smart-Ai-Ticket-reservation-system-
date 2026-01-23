import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../core/services/booking.service';
import { BookingStepperComponent } from '../../../../shared/components/booking-stepper/booking-stepper.component';
import { ConfirmationEntertainmentComponent } from '../confirmation-entertainment/confirmation-entertainment.component';
import { ConfirmationSportsComponent } from '../confirmation-sports/confirmation-sports.component';

import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BookingStepperComponent,
    ConfirmationEntertainmentComponent,
    ConfirmationSportsComponent
  ],
  templateUrl: './booking-confirmation.html'
})
export class BookingConfirmation implements OnInit {
  ticketId = '';
  booking = signal<Booking | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.paramMap.get('ticketId') || '';

    if (this.ticketId) {
      this.loadBooking();
    } else {
      this.router.navigate(['/']);
    }
  }

  loadBooking(): void {
    this.loading.set(true);
    this.bookingService.getBookingById(this.ticketId).subscribe({
      next: (booking) => {

        this.booking.set(booking);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading ticket:', err);
        this.loading.set(false);
      }
    });
  }

  isSportsEvent(): boolean {
    const b = this.booking();
    if (!b || typeof b.show_id !== 'object') return false;

    const show = b.show_id as any;
    let category = '';

    // Robust check for category string
    if (show.event_id) {
      if (typeof show.event_id.category === 'string') {
        category = show.event_id.category.toLowerCase();
      } else if (typeof show.event_id.category === 'object' && show.event_id.category.slug) {
        category = show.event_id.category.slug.toLowerCase();
      } else if (show.event_id.type) {
        category = show.event_id.type.toLowerCase();
      }
    }

    // Check known sports keywords
    return category === 'sports' || category === 'football' || category === 'match' || category === 'league';
  }
}