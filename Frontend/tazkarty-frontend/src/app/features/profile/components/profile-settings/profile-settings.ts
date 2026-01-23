import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 transition-colors duration-300">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ langService.translate('settings.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">{{ langService.translate('settings.subtitle') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Settings Navigation -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-2 sticky top-20 border border-gray-100 dark:border-gray-800">
              <nav class="space-y-1">
                @for (tab of tabs; track tab.id) {
                  <button
                    (click)="activeTab.set(tab.id)"
                    [class.bg-primary-600]="activeTab() === tab.id"
                    [class.text-white]="activeTab() === tab.id"
                    [class.text-gray-700]="activeTab() !== tab.id"
                    [class.dark:text-gray-300]="activeTab() !== tab.id"
                    [class.hover:bg-gray-100]="activeTab() !== tab.id"
                    [class.dark:hover:bg-gray-700]="activeTab() !== tab.id"
                    class="w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-3"
                  >
                    <span class="text-xl" [innerHTML]="tab.icon"></span>
                    <span>{{ langService.translate('settings.' + tab.id) }}</span>
                  </button>
                }
              </nav>
            </div>
          </div>

          <!-- Settings Content -->
          <div class="lg:col-span-3">
            <!-- Profile Information -->
            @if (activeTab() === 'profile') {
              <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-800 animate-fadeIn">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ langService.translate('settings.profile_info') }}
                </h2>

                @if (successMessage()) {
                  <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 dark:text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <p class="text-green-800 dark:text-green-200 font-medium">{{ successMessage() }}</p>
                    </div>
                  </div>
                }

                @if (errorMessage()) {
                  <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500 dark:text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p class="text-red-800 dark:text-red-200 font-medium">{{ errorMessage() }}</p>
                    </div>
                  </div>
                }

                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                  <div class="mb-6">
                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">{{ langService.translate('settings.full_name') }}</label>
                    <input
                      type="text"
                      formControlName="name"
                      class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>

                  <div class="mb-6">
                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">{{ langService.translate('settings.email') }}</label>
                    <input
                      type="email"
                      formControlName="email"
                      class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>

                  <div class="mb-6">
                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">{{ langService.translate('settings.phone') }}</label>
                    <input
                      type="tel"
                      formControlName="phone"
                      [placeholder]="langService.translate('auth.phone_placeholder')"
                      class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    [disabled]="profileForm.invalid || loading()"
                    class="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
                  >
                    @if (loading()) {
                      {{ langService.translate('settings.saving') }}
                    } @else {
                      {{ langService.translate('settings.save_changes') }}
                    }
                  </button>
                </form>
              </div>
            }

            <!-- Security -->
            @if (activeTab() === 'security') {
              <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-800 animate-fadeIn">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {{ langService.translate('settings.security_settings') }}
                </h2>

                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                  <div class="mb-6">
                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">{{ langService.translate('settings.current_pass') }}</label>
                    <input
                      type="password"
                      formControlName="currentPassword"
                      class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>

                  <div class="mb-6">
                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">{{ langService.translate('settings.new_pass') }}</label>
                    <input
                      type="password"
                      formControlName="newPassword"
                      class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>

                  <div class="mb-6">
                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">{{ langService.translate('settings.confirm_pass') }}</label>
                    <input
                      type="password"
                      formControlName="confirmPassword"
                      class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    [disabled]="passwordForm.invalid"
                    class="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg transition-all disabled:opacity-50"
                  >
                    {{ langService.translate('settings.change_pass') }}
                  </button>
                </form>
              </div>
            }

            <!-- Notifications -->
            @if (activeTab() === 'notifications') {
              <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-800 animate-fadeIn">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {{ langService.translate('settings.notif_prefs') }}
                </h2>

                <div class="space-y-4">
                  <!-- Email Notifications -->
                  <div class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <h3 class="font-bold text-gray-900 dark:text-white">{{ langService.translate('settings.email_notif') }}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ langService.translate('settings.email_notif_desc') }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <!-- Push Notifications -->
                  <div class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <h3 class="font-bold text-gray-900 dark:text-white">{{ langService.translate('settings.push_notif') }}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ langService.translate('settings.push_notif_desc') }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <!-- Reminders -->
                  <div class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <h3 class="font-bold text-gray-900 dark:text-white">{{ langService.translate('settings.reminders') }}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ langService.translate('settings.reminders_desc') }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <!-- Promotions -->
                  <div class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <h3 class="font-bold text-gray-900 dark:text-white">{{ langService.translate('settings.promo') }}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ langService.translate('settings.promo_desc') }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer">
                      <div class="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            }

            <!-- Danger Zone -->
            @if (activeTab() === 'account') {
              <div class="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-800 animate-fadeIn">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {{ langService.translate('settings.danger_zone') }}
                </h2>

                <div class="space-y-6">
                  <div class="border-2 border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-6 transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                    <h3 class="font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{{ langService.translate('settings.download_data') }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {{ langService.translate('settings.download_data_desc') }}
                    </p>
                    <button class="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 shadow-md transition font-bold">
                      {{ langService.translate('settings.download_btn') }}
                    </button>
                  </div>

                  <div class="border-2 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl p-6 transition-all hover:bg-red-100 dark:hover:bg-red-900/20">
                    <h3 class="font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{{ langService.translate('settings.delete_account') }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {{ langService.translate('settings.delete_account_desc') }}
                    </p>
                    <button
                      (click)="deleteAccount()"
                      class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition font-bold"
                    >
                      {{ langService.translate('settings.delete_btn') }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileSettings implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  activeTab = signal<'profile' | 'security' | 'notifications' | 'account'>('profile');
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Use inject for services
  authService = inject(AuthService);
  langService = inject(LanguageService);
  fb = inject(FormBuilder);

  tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>' },
    { id: 'security' as const, label: 'Security', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>' },
    { id: 'notifications' as const, label: 'Notifications', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>' },
    { id: 'account' as const, label: 'Account', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>' }
  ];

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.langService.translate('settings.update_success'));
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || this.langService.translate('settings.update_failed'));
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      alert(this.langService.translate('auth.pass_match'));
      return;
    }

    alert(this.langService.translate('settings.change_pass') + ' ' + this.langService.translate('contact.form_success'));
    this.passwordForm.reset();
  }

  deleteAccount(): void {
    if (confirm(this.langService.translate('settings.delete_confirm'))) {
      if (confirm(this.langService.translate('settings.delete_really'))) {
        alert(this.langService.translate('settings.delete_request'));
      }
    }
  }
}
