// =====================================================
// FILE: src/app/features/profile/components/notification-center/notification-center.ts
// Notification Center Component
// =====================================================

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { Notification } from '../../../../models/notification.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">🔔 Notifications</h1>
            <p class="text-gray-600">
              You have {{ unreadCount() }} unread notification(s)
            </p>
          </div>

          @if (notifications().length > 0) {
            <div class="flex gap-3">
              <button
                (click)="markAllAsRead()"
                class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                Mark All Read
              </button>
              <button
                (click)="clearAll()"
                class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Clear All
              </button>
            </div>
          }
        </div>

        <!-- Filter Tabs -->
        <div class="bg-white rounded-xl shadow-lg p-2 mb-8 inline-flex gap-2">
          @for (tab of tabs; track tab.value) {
            <button
              (click)="activeTab.set(tab.value)"
              [class.bg-primary-600]="activeTab() === tab.value"
              [class.text-white]="activeTab() === tab.value"
              [class.text-gray-700]="activeTab() !== tab.value"
              class="px-6 py-3 rounded-lg font-semibold transition-all"
            >
              {{ tab.label }}
              @if (getTabCount(tab.value) > 0) {
                <span
                  [class.bg-primary-700]="activeTab() === tab.value"
                  [class.text-white]="activeTab() === tab.value"
                  [class.bg-primary-100]="activeTab() !== tab.value"
                  [class.text-primary-600]="activeTab() !== tab.value"
                  class="ml-2 px-2 py-1 text-xs rounded-full font-bold"
                >
                  {{ getTabCount(tab.value) }}
                </span>
              }
            </button>
          }
        </div>

        <!-- Notifications List -->
        @if (loading()) {
          <div class="text-center py-20">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
            <p class="text-gray-600 text-lg">Loading notifications...</p>
          </div>
        } @else if (filteredNotifications().length === 0) {
          <div class="bg-white rounded-xl shadow-lg p-12 text-center">
            <span class="text-6xl mb-4 block">📭</span>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">No Notifications</h3>
            <p class="text-gray-600">
              @if (activeTab() === 'all') {
                You don't have any notifications yet
              } @else {
                You don't have any {{ activeTab() }} notifications
              }
            </p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (notification of filteredNotifications(); track notification._id) {
              <div
                [class.bg-blue-50]="!notification.is_read"
                [class.bg-white]="notification.is_read"
                [class.border-l-4]="!notification.is_read"
                [class.border-primary-600]="!notification.is_read"
                class="rounded-xl shadow hover:shadow-lg transition-all cursor-pointer"
                (click)="markAsRead(notification._id)"
              >
                <div class="p-6">
                  <div class="flex items-start gap-4">
                    <!-- Icon -->
                    <div
                      [class]="getNotificationColorClass(notification.type)"
                      class="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    >
                      {{ getNotificationIcon(notification.type) }}
                    </div>

                    <!-- Content -->
                    <div class="flex-1">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="font-bold text-gray-900 text-lg">
                          {{ notification.title }}
                        </h3>
                        @if (!notification.is_read) {
                          <span class="px-3 py-1 bg-primary-600 text-white text-xs rounded-full font-bold ml-3">
                            New
                          </span>
                        }
                      </div>

                      <p class="text-gray-700 mb-3">
                        {{ notification.message }}
                      </p>

                      <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-500">
                          {{ notification.createdAt | date:'medium' }}
                        </p>

                        <div class="flex gap-2">
                          @if (!notification.is_read) {
                            <button
                              (click)="markAsRead(notification._id); $event.stopPropagation()"
                              class="px-4 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition font-semibold"
                            >
                              Mark as Read
                            </button>
                          }
                          <button
                            (click)="deleteNotification(notification._id); $event.stopPropagation()"
                            class="px-4 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class NotificationCenter implements OnInit {
  loading = signal(true);
  activeTab = signal<'all' | 'unread' | 'booking' | 'payment'>('all');

  tabs = [
    { value: 'all' as const, label: 'All' },
    { value: 'unread' as const, label: 'Unread' },
    { value: 'booking' as const, label: 'Bookings' },
    { value: 'payment' as const, label: 'Payments' }
  ];

  notifications = computed(() => this.notificationService.notifications());
  unreadCount = computed(() => this.notificationService.unreadCount());

  filteredNotifications = computed(() => {
    const all = this.notifications();
    const tab = this.activeTab();

    if (tab === 'all') return all;
    if (tab === 'unread') return all.filter(n => !n.is_read);
    if (tab === 'booking') return all.filter(n => n.type === 'booking_confirmed' || n.type === 'reminder');
    if (tab === 'payment') return all.filter(n => n.type === 'payment_success' || n.type === 'payment_failed');

    return all;
  });

  constructor(
    public notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.notificationService.getUserNotifications(user._id).subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      });
    }
  }

  getTabCount(tab: string): number {
    if (tab === 'all') return this.notifications().length;
    if (tab === 'unread') return this.unreadCount();
    if (tab === 'booking') {
      return this.notifications().filter(n =>
        n.type === 'booking_confirmed' || n.type === 'reminder'
      ).length;
    }
    if (tab === 'payment') {
      return this.notifications().filter(n =>
        n.type === 'payment_success' || n.type === 'payment_failed'
      ).length;
    }
    return 0;
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  markAllAsRead(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.notificationService.markAllAsRead(user._id).subscribe();
    }
  }

  deleteNotification(notificationId: string): void {
    if (confirm('Delete this notification?')) {
      this.notificationService.deleteNotification(notificationId).subscribe();
    }
  }

  clearAll(): void {
    if (confirm('Clear all notifications? This action cannot be undone.')) {
      const user = this.authService.currentUser();
      if (user) {
        this.notificationService.clearAll(user._id).subscribe();
      }
    }
  }

  getNotificationIcon(type?: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationColorClass(type?: string): string {
    const colorMap: { [key: string]: string } = {
      'booking_confirmed': 'bg-green-100',
      'payment_success': 'bg-blue-100',
      'payment_failed': 'bg-red-100',
      'reminder': 'bg-yellow-100',
      'general': 'bg-gray-100'
    };
    return colorMap[type || 'general'] || 'bg-gray-100';
  }
}