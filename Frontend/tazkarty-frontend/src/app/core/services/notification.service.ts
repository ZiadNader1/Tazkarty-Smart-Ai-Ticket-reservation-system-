import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { Notification as NotificationModel, SocketNotification } from '../../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // State
  private notificationsSubject = new BehaviorSubject<NotificationModel[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  public unreadCount = signal<number>(0);
  public notifications = signal<NotificationModel[]>([]);

  constructor(
    private api: ApiService,
    private socket: SocketService
  ) {
    this.initializeSocketListeners();
  }

  /**
   * Initialize socket listeners for real-time notifications
   */
  private initializeSocketListeners(): void {
    // Listen for real-time notifications
    this.socket.notifications$.subscribe(socketNotification => {
      this.handleNewNotification(socketNotification);
    });
  }

  /**
   * Handle new notification from socket
   */
  private handleNewNotification(socketNotification: SocketNotification): void {
    // Convert socket notification to Notification format
    const notification: NotificationModel = {
      _id: Date.now().toString(), // Temporary ID
      user_id: '', // Will be set by backend
      title: socketNotification.title,
      message: socketNotification.message,
      type: socketNotification.type as any,
      is_read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to local state
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.notifications.set([notification, ...current]);
    this.updateUnreadCount();

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    // Play notification sound (optional)
    this.playNotificationSound();
  }

  /**
   * Get all notifications for current user
   */
  getUserNotifications(userId: string): Observable<NotificationModel[]> {
    return this.api.get<NotificationModel[]>(`notifications/user/${userId}`)
      .pipe(
        tap(notifications => {
          this.notificationsSubject.next(notifications);
          this.notifications.set(notifications);
          this.updateUnreadCount();
        })
      );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<NotificationModel> {
    return this.api.put<NotificationModel>(`notifications/read/${notificationId}`, {})
      .pipe(
        tap(updatedNotification => {
          const current = this.notificationsSubject.value;
          const index = current.findIndex(n => n._id === notificationId);

          if (index !== -1) {
            current[index] = updatedNotification;
            this.notificationsSubject.next([...current]);
            this.notifications.set([...current]);
            this.updateUnreadCount();
          }
        })
      );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): Observable<any> {
    const current = this.notificationsSubject.value;
    const unreadIds = current.filter(n => !n.is_read).map(n => n._id);

    // Mark all unread as read
    const requests = unreadIds.map(id =>
      this.markAsRead(id).toPromise()
    );

    return new Observable(observer => {
      Promise.all(requests).then(() => {
        observer.next({ success: true });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<any> {
    return this.api.delete(`notifications/${notificationId}`)
      .pipe(
        tap(() => {
          const current = this.notificationsSubject.value;
          const filtered = current.filter(n => n._id !== notificationId);
          this.notificationsSubject.next(filtered);
          this.notifications.set(filtered);
          this.updateUnreadCount();
        })
      );
  }

  /**
   * Clear all notifications
   */
  clearAll(userId: string): Observable<any> {
    const current = this.notificationsSubject.value;
    const deleteRequests = current.map(n =>
      this.deleteNotification(n._id).toPromise()
    );

    return new Observable(observer => {
      Promise.all(deleteRequests).then(() => {
        this.notificationsSubject.next([]);
        this.notifications.set([]);
        this.updateUnreadCount();
        observer.next({ success: true });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    const unread = this.notificationsSubject.value.filter(n => !n.is_read).length;
    this.unreadCount.set(unread);
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: NotificationModel): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png'
      });
    }
  }

  /**
   * Request notification permission
   */
  requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.reject('Notifications not supported');
    }

    return Notification.requestPermission();
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(err => {

      });
    } catch (err) {

    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type?: string): string {
    const icons: { [key: string]: string } = {
      'booking_confirmed': '🎉',
      'payment_success': '💳',
      'payment_failed': '❌',
      'reminder': '⏰',
      'general': '📢'
    };

    return icons[type || 'general'] || '📢';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type?: string): string {
    const colors: { [key: string]: string } = {
      'booking_confirmed': 'bg-green-100 text-green-800',
      'payment_success': 'bg-blue-100 text-blue-800',
      'payment_failed': 'bg-red-100 text-red-800',
      'reminder': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-gray-100 text-gray-800'
    };

    return colors[type || 'general'] || 'bg-gray-100 text-gray-800';
  }
}