
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeatSelection } from './components/seat-selection/seat-selection';
import { BookingSummary } from './components/booking-summary/booking-summary';
import { PaymentCheckout } from './components/payment-checkout/payment-checkout';
import { BookingConfirmation } from './components/booking-confirmation/booking-confirmation';

const routes: Routes = [
  {
    path: 'seats/:showId',
    component: SeatSelection
  },
  {
    path: 'summary/:ticketId',
    component: BookingSummary
  },
  {
    path: 'payment/:ticketId',
    component: PaymentCheckout
  },
  {
    path: 'confirmation/:ticketId',
    component: BookingConfirmation
  },
  {
    path: '',
    redirectTo: '/events',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingRoutingModule { }