
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';


@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-dark-card border-b border-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center space-x-2 rtl:space-x-reverse">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <span class="text-xl font-extrabold text-white tracking-tight">{{ langService.translate('home.title') }}</span>
            </a>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-6 rtl:space-x-reverse text-sm font-medium">
            <a routerLink="/" routerLinkActive="text-primary-500" [routerLinkActiveOptions]="{exact: true}"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.home') }}
            </a>
            <a routerLink="/events" [queryParams]="{category: 'sports'}" routerLinkActive="text-primary-500"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.sports') }}
            </a>
            <a routerLink="/events" [queryParams]="{category: 'entertainment'}" routerLinkActive="text-primary-500"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.entertainment') }}
            </a>
            <a routerLink="/trains" routerLinkActive="text-primary-500"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.trains') }}
            </a>

            <a routerLink="/stores" routerLinkActive="text-primary-500"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.stores') }}
            </a>
            <a routerLink="/faq" routerLinkActive="text-primary-500"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.faq') }}
            </a>
           
            <a routerLink="/contact" routerLinkActive="text-primary-500"
               class="text-gray-300 hover:text-primary-400 transition">
              {{ langService.translate('nav.contact') }}
            </a>

            @if (authService.isAuthenticated()) {
              <a routerLink="/ai-assistant" routerLinkActive="text-primary-500"
                 class="text-gray-300 hover:text-primary-400 transition">
                {{ langService.translate('nav.ai_assistant') }}
              </a>
            }
          </div>

          <!-- Right Side -->
          <div class="flex items-center space-x-3 rtl:space-x-reverse">
            <!-- Language Toggle Button -->
            <button (click)="langService.toggleLanguage()" 
                    class="flex items-center gap-2 p-2 rounded-xl text-gray-300 hover:bg-gray-800 transition focus:outline-none border border-transparent hover:border-gray-700">
              @if (langService.currentLang() === 'en') {
                <span class="text-xl">🇪🇬</span>
                <span class="text-xs font-bold uppercase tracking-widest hidden sm:block">العربية</span>
              } @else {
                <span class="text-xl">🇬🇧</span>
                <span class="text-xs font-bold uppercase tracking-widest hidden sm:block">English</span>
              }
            </button>

            @if (authService.isAuthenticated()) {
              <!-- Notifications -->
              <button (click)="toggleNotifications()" 
                      class="relative p-2 rounded-full text-gray-300 hover:bg-gray-800 transition focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                @if (notificationService.unreadCount() > 0) {
                  <span class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {{ notificationService.unreadCount() }}
                  </span>
                }
              </button>

              <!-- User Menu -->
              <div class="relative">
                <button (click)="toggleUserMenu()"
                        class="flex items-center space-x-2 rtl:space-x-reverse p-1.5 rounded-full hover:bg-gray-800 transition focus:outline-none">
                  <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                    {{ userInitial() }}
                  </div>
                  <span class="hidden md:block text-sm font-medium text-gray-200">{{ userName() }}</span>
                </button>

                <!-- User Dropdown -->
                @if (showUserMenu()) {
                  <div class="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 bg-dark-card rounded-xl shadow-xl border border-gray-700 py-1 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                    @if (authService.isAdmin()) {
                      <a routerLink="/admin" class="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800">
                        {{ langService.translate('nav.admin_dashboard') }}
                      </a>
                    }
                    <a routerLink="/profile/bookings" class="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800">
                      {{ langService.translate('nav.my_bookings') }}
                    </a>
                    <a routerLink="/profile/settings" class="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800">
                      {{ langService.translate('nav.settings') }}
                    </a>
                    <div class="h-px bg-gray-700 my-1"></div>
                    <button (click)="logout()" class="w-full text-left rtl:text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-900/10 transition-colors">
                      {{ langService.translate('nav.logout') }}
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/auth/login" 
                 class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-primary-400 transition">
                {{ langService.translate('nav.login') }}
              </a>
              <a routerLink="/auth/register"
                 class="px-5 py-2 text-sm font-bold bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5">
                {{ langService.translate('nav.signup') }}
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Notification Panel -->
      @if (showNotifications()) {
        <div class="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 bg-dark-card rounded-xl shadow-2xl border border-gray-700 z-50 max-h-[30rem] overflow-y-auto"
             style="top: 60px; right: 16px;">
          <div class="p-4 border-b border-gray-700 bg-gray-800/50">
            <h3 class="font-bold text-white">{{ langService.translate('nav.notifications') }}</h3>
          </div>
          <div class="divide-y divide-gray-700">
            @for (notification of notificationService.notifications(); track notification._id) {
              <div class="p-4 hover:bg-gray-800 cursor-pointer transition-colors"
                   [class.bg-blue-900/10]="!notification.is_read"
                   (click)="markAsRead(notification._id)">
                <p class="font-semibold text-sm text-gray-100">{{ notification.title }}</p>
                <p class="text-gray-400 text-xs mt-1 leading-relaxed">{{ notification.message }}</p>
                <p class="text-gray-500 text-[10px] mt-2">{{ notification.createdAt | date:'short' }}</p>
              </div>
            } @empty {
              <div class="p-8 text-center text-gray-400 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="text-sm">{{ langService.translate('nav.no_notifications') }}</span>
              </div>
            }
          </div>
        </div>
      }
    </nav>
  `,
  styleUrl: './navbar.scss'
})
export class Navbar {
  showUserMenu = signal(false);
  showNotifications = signal(false);

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    public langService: LanguageService
  ) { }

  userInitial = computed(() => {
    const user = this.authService.currentUser();
    return user?.name?.charAt(0).toUpperCase() || 'U';
  });

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.name || 'User';
  });

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu.set(false);
  }
}
