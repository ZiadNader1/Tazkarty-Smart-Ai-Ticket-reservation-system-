import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { LoadingSpinner } from './shared/components/loading-spinner/loading-spinner';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { NotificationService } from './core/services/notification.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    Navbar,
    Footer,
    LoadingSpinner
  ],
  template: `
    <div class="min-h-screen bg-dark-bg flex flex-col">
      <app-navbar />
      
      <main class="flex-1">
        <router-outlet />
      </main>
      
      <app-footer />
      
      <!-- Global Loading Spinner -->
      @if (loadingService.isLoading()) {
        <app-loading-spinner />
      }
    </div>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    public loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    // Connect socket if user is authenticated
    if (this.authService.isLoggedIn()) {
      this.socketService.connect();

      // Request notification permission
      this.notificationService.requestNotificationPermission();

      // Load user notifications
      const user = this.authService.currentUser();
      if (user && user._id) {
        this.notificationService.getUserNotifications(user._id).subscribe();
      }
    }
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}