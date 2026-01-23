
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword {
  forgotPasswordForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  emailSent = signal(false);
  submittedEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.get('email')?.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.submittedEmail = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(this.submittedEmail).subscribe({
      next: () => {
        this.loading.set(false);
        this.emailSent.set(true);
      },
      error: (error) => {
        this.loading.set(false);
        if (error.status === 429) {
          this.errorMessage.set('Too many attempts. Please try again in an hour.');
        } else {
          this.errorMessage.set(error.error?.message || 'Failed to send reset email. Please try again.');
        }
      }
    });
  }

  resetForm(): void {
    this.emailSent.set(false);
    this.forgotPasswordForm.reset();
    this.errorMessage.set('');
  }
}