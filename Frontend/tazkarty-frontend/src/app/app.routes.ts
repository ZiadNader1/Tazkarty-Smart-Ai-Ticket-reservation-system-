import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  // Home
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },

  // Static Pages
  {
    path: 'stores',
    loadComponent: () => import('./features/pages/stores/stores').then(m => m.StoresComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/pages/faq/faq').then(m => m.FaqComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/pages/about/about').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/pages/contact/contact').then(m => m.ContactComponent)
  },
  {
    path: 'trains',
    loadComponent: () => import('./features/trains/components/train-reservation/train-reservation').then(m => m.TrainReservation)
  },
  {
    path: 'trains/book/:trainNumber',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trains/components/train-booking/train-booking').then(m => m.TrainBooking)
  },

  // Auth
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/components/register/register').then(m => m.Register)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Events
  {
    path: 'events',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/events/components/event-list/event-list').then(m => m.EventList)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/events/components/event-detail/event-detail').then(m => m.EventDetail)
      }
    ]
  },

  // Booking (Protected)
  {
    path: 'booking',
    canActivate: [authGuard],
    children: [
      {
        path: 'seats/:showId',
        loadComponent: () => import('./features/booking/components/seat-selection/seat-selection').then(m => m.SeatSelection)
      },
      {
        path: 'summary/:ticketId',
        loadComponent: () => import('./features/booking/components/booking-summary/booking-summary').then(m => m.BookingSummary)
      },
      {
        path: 'payment/:ticketId',
        loadComponent: () => import('./features/booking/components/payment-checkout/payment-checkout').then(m => m.PaymentCheckout)
      },
      {
        path: 'confirmation/:ticketId',
        loadComponent: () => import('./features/booking/components/booking-confirmation/booking-confirmation').then(m => m.BookingConfirmation)
      }
    ]
  },

  // Profile (Protected)
  {
    path: 'profile',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'bookings',
        pathMatch: 'full'
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/profile/components/my-bookings/my-bookings').then(m => m.MyBookings)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/profile/components/my-tickets/my-tickets').then(m => m.MyTickets)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/profile/components/profile-settings/profile-settings').then(m => m.ProfileSettings)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/profile/components/notification-center/notification-center').then(m => m.NotificationCenter)
      }
    ]
  },

  // AI Assistant (Protected)
  {
    path: 'ai-assistant',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/ai-assistant/components/chat-interface/chat-interface').then(m => m.ChatInterfaceComponent)
      },
      {
        path: 'recommendations',
        loadComponent: () => import('./features/ai-assistant/components/recommendations/recommendations').then(m => m.RecommendationsComponent)
      }
    ]
  },

  // Admin (Protected - Admin Only)
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/components/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('./features/admin/components/event-management/event-management').then(m => m.EventManagementComponent)
      },
      {
        path: 'events/new',
        loadComponent: () => import('./features/admin/components/event-create/event-create').then(m => m.AdminEventCreate)
      },
      {
        path: 'events/:eventId/shows',
        loadComponent: () => import('./features/admin/components/show-management/show-management').then(m => m.AdminShowManagement)
      },
      {
        path: 'stadiums',
        loadComponent: () => import('./features/admin/components/stadium-management/stadium-management').then(m => m.StadiumManagementComponent)
      },
      {
        path: 'venues',
        loadComponent: () => import('./features/admin/components/venue-management/venue-management').then(m => m.VenueManagementComponent)
      },
      {
        path: 'shows',
        loadComponent: () => import('./features/admin/components/show-management/show-management').then(m => m.AdminShowManagement)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/components/user-management/user-management').then(m => m.UserManagementComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/admin/components/analytics/analytics').then(m => m.AnalyticsComponent)
      },
      {
        path: 'halls/:id/seat-map',
        loadComponent: () => import('./features/admin/components/seat-editor/seat-editor').then(m => m.SeatEditorComponent)
      }
    ]
  },

  // 404
  {
    path: '**',
    redirectTo: ''
  }
];