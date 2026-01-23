import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../models/booking.model';
import { StripeCardComponent, NgxStripeModule, StripeService } from 'ngx-stripe';
import {
  StripeCardElementOptions,
  StripeElementsOptions
} from '@stripe/stripe-js';
import { BookingStepperComponent } from '../../../../shared/components/booking-stepper/booking-stepper.component';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxStripeModule, BookingStepperComponent],
  templateUrl: './payment-checkout.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PaymentCheckout implements OnInit {
  @ViewChild(StripeCardComponent) card!: StripeCardComponent;

  ticketId = '';
  booking = signal<Booking | null>(null);
  loading = signal(true);
  processing = signal(false);
  paymentError = signal<string | null>(null);

  // Form Inputs
  cardHolderName = '';
  agreedToTerms = false;

  // Stripe Options
  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#CFD7E0'
        }
      }
    }
  };

  elementsOptions: StripeElementsOptions = {
    locale: 'en'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private stripeService: StripeService,
    public langService: LanguageService
  ) { }

  sportsParams: any = null;

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.paramMap.get('ticketId') || '';

    // Capture sports params if present
    this.route.queryParams.subscribe(params => {
      if (params['sectionId']) {
        this.sportsParams = {
          sectionId: params['sectionId'],
          sectionName: params['sectionName'],
          price: params['price'],
          count: params['count']
        };
      }
    });

    if (this.ticketId) {
      this.loadBooking();
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
        console.error('Error loading booking:', err);
        this.loading.set(false);
        this.router.navigate(['/']);
      }
    });
  }

  onChange(event: any) {
    if (event.error) {
      this.paymentError.set(event.error.message);
    } else {
      this.paymentError.set(null);
    }
  }

  pay(): void {
    // if (!this.agreedToTerms) return; // Removed as no UI exists for it
    if (this.processing()) return;



    this.processing.set(true);
    this.paymentError.set(null);

    // 1. Create Payment Intent on Backend
    this.paymentService.createPaymentSession({
      ticketId: this.ticketId
    }).subscribe({
      next: (response) => {
        const clientSecret = response.clientSecret;

        // CHECK FOR MOCK
        if (clientSecret.startsWith('pi_mock_')) {

          // Mock success immediately
          this.confirmBackendBooking(response.payment.transaction_id || 'mock_txn_' + Date.now());
          return;
        }

        // 2. Confirm Card Payment with Stripe
        this.stripeService.confirmCardPayment(clientSecret, {
          payment_method: {
            card: this.card.element,
            billing_details: {
              name: this.cardHolderName
            }
          }
        }).subscribe({
          next: (result) => {
            if (result.error) {
              // Show error to your customer
              this.paymentError.set(result.error.message || this.langService.translate('booking.error_payment_failed'));
              this.processing.set(false);
            } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
              // 3. Confirm on Backend
              this.confirmBackendBooking(result.paymentIntent.id);
            }
          },
          error: (err) => {
            console.error('Stripe confirm error:', err);
            this.paymentError.set(this.langService.translate('booking.error_processing'));
            this.processing.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Session creation failed:', err);
        this.paymentError.set(this.langService.translate('booking.error_initiate'));
        this.processing.set(false);
      }
    });
  }

  confirmBackendBooking(transactionId: string) {
    this.paymentService.confirmPayment({ paymentIntentId: transactionId }).subscribe({
      next: () => {
        this.processing.set(false);
        // Pass sports params forward if they exist
        const queryParams = this.sportsParams || {};
        this.router.navigate(['/booking/confirmation', this.ticketId], { queryParams });
      },
      error: (err) => {
        console.error('Booking confirmation failed:', err);
        this.processing.set(false);
        this.paymentError.set(this.langService.translate('booking.error_confirm_failed'));
      }
    });
  }

  // Helper methods for robust template access
  getEventTitle(): string {
    const b = this.booking() as any;
    if (b) {
      if (b.isTrain) return `${this.langService.translate('nav.trains')} #${b.train_number}`;
      if (typeof b.show_id === 'object' && 'event_id' in b.show_id) {
        const show = b.show_id as any;
        return this.langService.translate(show.event_id?.title || show.title || 'common.general');
      }
    }
    return this.langService.translate('common.general');
  }

  getEventDate(): Date | null {
    const b = this.booking() as any;
    if (b) {
      if (b.isTrain) return b.travel_date;
      if (typeof b.show_id === 'object') {
        return (b.show_id as any).start_time;
      }
    }
    return null;
  }

  getVenueName(): string {
    const b = this.booking() as any;
    if (b) {
      if (b.isTrain) return `${b.departure_city} → ${b.destination_city}`;
      if (typeof b.show_id === 'object') {
        const show = b.show_id as any;
        if (show.event_id && typeof show.event_id === 'object' && show.event_id.venue_id) {
          const venue = show.event_id.venue_id;
          return (typeof venue === 'object') ? this.langService.translate((venue as any).name) : '';
        }
        if (show.event_id && typeof show.event_id === 'object' && show.event_id.stadium_id) {
          const stadium = show.event_id.stadium_id;
          return (typeof stadium === 'object') ? this.langService.translate((stadium as any).name) : '';
        }
      }
    }
    return '';
  }

  retryPayment(): void {
    this.paymentError.set(null);
    // Focus logic if needed
  }

  goBack(): void {
    const b = this.booking();
    if (b && b.show_id) {
      // @ts-ignore
      const showId = b.show_id._id || b.show_id;

      // If we have sports params, use them to reconstruct the original URL
      if (this.sportsParams) {
        this.router.navigate(['/booking/seats', showId], {
          queryParams: this.sportsParams
        });
      } else {
        // Fallback to ticket restoration (Standard Mode)
        this.router.navigate(['/booking/seats', showId], {
          queryParams: {
            restoreTicketId: this.ticketId
          }
        });
      }
    } else {
      window.history.back();
    }
  }
}
