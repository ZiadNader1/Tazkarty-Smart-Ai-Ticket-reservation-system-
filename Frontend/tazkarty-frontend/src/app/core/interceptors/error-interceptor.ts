import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            // Unauthorized - logout and redirect
            authService.logout();
            errorMessage = 'Unauthorized access. Please login.';
            break;
          case 403:
            // Forbidden
            errorMessage = 'Access forbidden';
            router.navigate(['/']);
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          default:
            errorMessage = error.error?.message || error.message || 'Unknown error';
        }
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        error: error
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};