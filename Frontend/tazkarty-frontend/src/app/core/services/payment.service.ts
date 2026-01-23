import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Payment,
  PaymentSessionRequest,
  PaymentSessionResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse
} from '../../models/payment.model';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  constructor(private api: ApiService) {
    this.initializeStripe();
  }

  /**
   * Initialize Stripe
   */
  private async initializeStripe(): Promise<void> {
    this.stripe = await loadStripe(environment.stripePublishableKey);
  }

  /**
   * Create payment session
   */
  createPaymentSession(request: PaymentSessionRequest): Observable<PaymentSessionResponse> {
    return this.api.post('payments/create-session', request);
  }

  /**
   * Confirm payment
   */
  confirmPayment(request: ConfirmPaymentRequest): Observable<ConfirmPaymentResponse> {
    return this.api.post('payments/confirm', request);
  }

  /**
   * Get user payments
   */
  getUserPayments(userId: string): Observable<Payment[]> {
    return this.api.get(`payments/user/${userId}`);
  }

  /**
   * Get all payments (admin)
   */
  getAllPayments(): Observable<Payment[]> {
    return this.api.get('payments');
  }

  /**
   * Get Stripe instance
   */
  getStripe(): Stripe | null {
    return this.stripe;
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(clientSecret: string, cardElement: any): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  }
}