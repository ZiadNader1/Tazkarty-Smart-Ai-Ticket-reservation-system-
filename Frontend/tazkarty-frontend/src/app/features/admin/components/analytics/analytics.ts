import { Component, OnInit, signal, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin';
import { LanguageService } from '../../../../core/services/language.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';

interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  activeEvents: number;
  conversionRate: number;
}

interface EventStats {
  name: string;
  bookings: number;
  revenue: number;
  category: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.scss']
})
export class AnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);
  public langService = inject(LanguageService);

  loading = signal(false);
  selectedPeriod = signal<'week' | 'month' | 'year'>('month');

  // Stats
  stats = signal<DashboardStats>({
    totalRevenue: 0,
    totalBookings: 0,
    activeEvents: 0,
    conversionRate: 0
  });

  // Top Events
  topEvents = signal<EventStats[]>([]);

  // Chart Properties
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: this.langService.translate('admin.analytics.revenue'),
        fill: true,
        tension: 0.4,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10b981'
      },
      {
        data: [],
        label: this.langService.translate('admin.analytics.bookings'),
        yAxisID: 'y1',
        fill: true,
        tension: 0.4,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6'
      }
    ]
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9ca3af' }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        displayColors: true
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: this.langService.translate('admin.analytics.revenue'),
          color: '#9ca3af'
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9ca3af' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: {
          display: true,
          text: this.langService.translate('admin.analytics.bookings'),
          color: '#9ca3af'
        },
        ticks: { color: '#9ca3af' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
      borderWidth: 0,
      hoverOffset: 15
    }]
  };
  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ca3af',
          padding: 20,
          font: { size: 12 }
        }
      }
    }
  };

  constructor() { }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading.set(true);

    forkJoin({
      dashboard: this.adminService.getDashboardStats(),
      revenue: this.adminService.getRevenueStats(),
      bookings: this.adminService.getBookingStats()
    }).subscribe({
      next: (results) => {
        // 1. Dashboard Stats
        this.stats.set({
          totalRevenue: results.dashboard.total_revenue || 0,
          totalBookings: results.dashboard.total_bookings || 0,
          activeEvents: results.dashboard.active_events || 0,
          conversionRate: results.dashboard.conversion_rate || 0
        });

        // 2. Revenue & Bookings Chart
        const revenueData = results.revenue.data || [];
        revenueData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        this.lineChartData.labels = revenueData.map((d: any) => d.date);
        this.lineChartData.datasets[0].data = revenueData.map((d: any) => d.revenue);
        this.lineChartData.datasets[1].data = revenueData.map((d: any) => d.bookings);

        // 3. Category Breakdown
        const categoryStats = results.dashboard.categories || [];
        this.pieChartData.labels = categoryStats.map((c: any) => c._id);
        this.pieChartData.datasets[0].data = categoryStats.map((c: any) => c.count);

        // 4. Top Events
        const events = results.bookings.top_events || [];
        this.topEvents.set(events.map((e: any) => ({
          name: e.title,
          bookings: e.total_bookings,
          revenue: e.total_revenue,
          category: e.type
        })));

        this.chart?.update();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Analytics Error:', err);
        this.loadMockData();
        this.loading.set(false);
      }
    });
  }

  loadMockData() {
    this.stats.set({ totalRevenue: 154000, totalBookings: 3200, activeEvents: 12, conversionRate: 6.5 });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.lineChartData.labels = months;
    this.lineChartData.datasets[0].data = [12000, 19000, 15000, 25000, 22000, 30000];
    this.lineChartData.datasets[1].data = [150, 220, 180, 290, 260, 350];

    this.pieChartData.labels = ['Concerts', 'Movies', 'Sports', 'Shows'];
    this.pieChartData.datasets[0].data = [40, 35, 25, 10];

    this.topEvents.set([
      { name: 'Avatar: The Way of Water', bookings: 2840, revenue: 142000, category: 'movie' },
      { name: 'Amr Diab Concert', bookings: 1920, revenue: 230400, category: 'concert' },
      { name: 'Al Ahly vs Zamalek', bookings: 1650, revenue: 132000, category: 'sports' }
    ]);

    this.chart?.update();
  }

  selectPeriod(period: 'week' | 'month' | 'year'): void {
    this.selectedPeriod.set(period);
    this.loadAnalytics();
  }

  exportData(): void {
    const data = this.topEvents();
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Name,Bookings,Revenue,Category"].concat(
        data.map(e => `${e.name},${e.bookings},${e.revenue},${e.category}`)
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${this.selectedPeriod()}.csv`);
    document.body.appendChild(link);
    link.click();
  }

  downloadReport(): void {
    alert('Generating PDF report...');
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  // Helper for template compatibility
  totalRevenue = () => this.stats().totalRevenue;
  totalBookings = () => this.stats().totalBookings;
  averageTicketPrice = () => (this.stats().totalRevenue / (this.stats().totalBookings || 1)).toFixed(2);
  conversionRate = () => this.stats().conversionRate;
}
