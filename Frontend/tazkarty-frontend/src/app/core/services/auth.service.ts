// =====================================================
// FILE: src/app/core/services/auth.service.ts
// Authentication Service with JWT
// =====================================================

import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse
} from '../../models/user.model';
import {
  Admin,
  AdminAuthResponse
} from '../../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly ADMIN_KEY = 'current_admin';

  // Signals for reactive state
  currentUser = signal<User | null>(null);
  currentAdmin = signal<Admin | null>(null);
  isAuthenticated = signal<boolean>(false);
  isAdmin = signal<boolean>(false);

  // Observables for components that need them
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  // =====================================================
  // USER AUTHENTICATION
  // =====================================================

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('users/register', data)
      .pipe(
        tap(response => {
          if (response.token) {
            this.handleAuthSuccess(response.token, response.user);
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('users/login', credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.handleAuthSuccess(response.token, response.user);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  /**
   * Verify Email
   */
  verifyEmail(token: string): Observable<any> {
    return this.api.get(`users/verify-email/${token}`);
  }

  /**
   * Forgot Password
   */
  forgotPassword(email: string): Observable<any> {
    return this.api.post('users/forgot-password', { email });
  }

  /**
   * Reset Password
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.api.put(`users/reset-password/${token}`, { password });
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<User> {
    return this.api.get<User>('users/profile')
      .pipe(
        tap(user => {
          this.currentUser.set(user);
          this.userSubject.next(user);
          this.storage.setItem(this.USER_KEY, user);
        })
      );
  }

  /**
   * Update user profile
   */
  updateProfile(data: Partial<User>): Observable<any> {
    return this.api.put<AuthResponse>('users/update', data)
      .pipe(
        tap(response => {
          if (response.user) {
            this.currentUser.set(response.user);
            this.userSubject.next(response.user);
            this.storage.setItem(this.USER_KEY, response.user);
          }
        })
      );
  }

  // =====================================================
  // ADMIN AUTHENTICATION
  // =====================================================

  /**
   * Register new admin
   */
  registerAdmin(data: any): Observable<AdminAuthResponse> {
    return this.api.post<AdminAuthResponse>('admins/register', data)
      .pipe(
        tap(response => {
          if (response.token) {
            this.handleAdminAuthSuccess(response.token, response.admin);
          }
        })
      );
  }

  /**
   * Login admin
   */
  loginAdmin(credentials: LoginRequest): Observable<AdminAuthResponse> {
    return this.api.post<AdminAuthResponse>('admins/login', credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.handleAdminAuthSuccess(response.token, response.admin);
          }
        })
      );
  }

  /**
   * Get admin profile
   */
  getAdminProfile(): Observable<Admin> {
    return this.api.get<Admin>('admins/profile')
      .pipe(
        tap(admin => {
          this.currentAdmin.set(admin);
          this.storage.setItem(this.ADMIN_KEY, admin);
        })
      );
  }

  // =====================================================
  // TOKEN MANAGEMENT
  // =====================================================

  /**
   * Get stored token
   */
  getToken(): string | null {
    return this.storage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if current user is admin
   */
  isAdminUser(): boolean {
    return this.isAdmin();
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  /**
   * Logout user/admin
   */
  logout(): void {
    // Clear storage
    this.storage.removeItem(this.TOKEN_KEY);
    this.storage.removeItem(this.USER_KEY);
    this.storage.removeItem(this.ADMIN_KEY);

    // Reset state
    this.currentUser.set(null);
    this.currentAdmin.set(null);
    this.isAuthenticated.set(false);
    this.isAdmin.set(false);
    this.userSubject.next(null);

    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(token: string, user?: User): void {
    this.storage.setItem(this.TOKEN_KEY, token);

    if (user) {
      this.currentUser.set(user);
      this.userSubject.next(user);
      this.storage.setItem(this.USER_KEY, user);
    }

    this.isAuthenticated.set(true);
    this.isAdmin.set(user?.role === 'admin');
  }

  /**
   * Handle successful admin authentication
   */
  private handleAdminAuthSuccess(token: string, admin?: Admin): void {
    this.storage.setItem(this.TOKEN_KEY, token);

    if (admin) {
      this.currentAdmin.set(admin);
      this.storage.setItem(this.ADMIN_KEY, admin);
    }

    this.isAuthenticated.set(true);
    this.isAdmin.set(true);
  }

  /**
   * Load stored authentication data
   */
  private loadStoredAuth(): void {
    const token = this.getToken();

    if (token && this.isLoggedIn()) {
      // Try to load user
      const storedUser = this.storage.getItem<User>(this.USER_KEY);
      if (storedUser) {
        this.currentUser.set(storedUser);
        this.userSubject.next(storedUser);
        this.isAuthenticated.set(true);
        this.isAdmin.set(storedUser.role === 'admin');
        return;
      }

      // Try to load admin
      const storedAdmin = this.storage.getItem<Admin>(this.ADMIN_KEY);
      if (storedAdmin) {
        this.currentAdmin.set(storedAdmin);
        this.isAuthenticated.set(true);
        this.isAdmin.set(true);
        return;
      }

      // Token exists but no user/admin data, fetch from server
      this.getProfile().subscribe({
        error: () => {
          // If user fetch fails, try admin
          this.getAdminProfile().subscribe({
            error: () => {
              // Both failed, logout
              this.logout();
            }
          });
        }
      });
    }
  }
}