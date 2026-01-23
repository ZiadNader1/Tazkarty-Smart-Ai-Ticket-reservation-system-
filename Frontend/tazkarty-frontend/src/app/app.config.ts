import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { provideNgxStripe } from 'ngx-stripe';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    importProvidersFrom(
      CommonModule,
      FormsModule,
      ReactiveFormsModule
    ),
    provideCharts(withDefaultRegisterables()),
    provideNgxStripe('pk_test_51LFkP5Hq3k5l2qX5lE4X7q7x7q7x7q7x7q7x7q7x7q7x7q7x7q7x7q7x7q7x7q7') // Replace with env variable in production
  ]
};