import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalEvents: number;
  todayBookings: number;
  todayRevenue: number;
  revenueGrowth?: number;
  bookingsGrowth?: number;
  eventsGrowth?: number;
  usersGrowth?: number;
}

interface RecentBooking {
  _id: string;
  user_id: { name: string; email: string };
  show_id: { event_id: { title: string } };
  total_price: number;
  status: string;
  booking_time: Date;
}

import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalEvents: 0,
    todayBookings: 0,
    todayRevenue: 0
  };

  recentBookings: RecentBooking[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load stats
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = {
          totalUsers: data.total_users || 0,
          totalBookings: data.total_bookings || 0,
          totalRevenue: data.total_revenue || 0,
          totalEvents: data.active_sports || 0, // Specifically for active sports card
          todayBookings: data.todayBookings || 0,
          todayRevenue: data.todayRevenue || 0,
          revenueGrowth: data.revenueGrowth,
          bookingsGrowth: data.bookingsGrowth,
          eventsGrowth: data.eventsGrowth,
          usersGrowth: data.usersGrowth
        };
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error = 'Failed to load dashboard statistics';
      }
    });


    // Load recent bookings
    this.adminService.getRecentBookings(10).subscribe({
      next: (response) => {
        this.recentBookings = response.data || [];
        this.loading = false;
      },

      error: (err) => {
        console.error('Error loading bookings:', err);
        this.loading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([`/admin/${route}`]);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'booked': 'status-success',
      'pending': 'status-warning',
      'cancelled': 'status-danger'
    };
    return statusMap[status] || 'status-default';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  }


  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventTitle(booking: RecentBooking): string {
    return booking?.show_id?.event_id?.title || 'Unknown Event';
  }
}