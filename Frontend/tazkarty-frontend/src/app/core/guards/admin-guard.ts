import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdminUser()) {
    return true;
  }

  // Redirect based on authentication status
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
  } else {
    router.navigate(['/']); // Not authorized as admin
  }
  return false;
};
