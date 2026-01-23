import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventsService } from '../../../../core/services/events.service';

@Component({
    selector: 'app-admin-event-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './event-create.html'
})
export class AdminEventCreate {
    eventForm: FormGroup;
    loading = signal(false);
    previewImage = signal<string | null>(null);

    categories = ['Movies', 'Concerts', 'Theater', 'Sports', 'Comedy'];
    eventTypes = ['Movie', 'Concert', 'Play', 'Match', 'Standup'];

    constructor(
        private fb: FormBuilder,
        private eventsService: EventsService,
        private router: Router
    ) {
        this.eventForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            type: ['Movie', Validators.required],
            category: ['Movies', Validators.required],
            poster_url: ['', Validators.required],
            banner_url: [''],
            duration_minutes: [120, [Validators.required, Validators.min(1)]],
            rating: [0, [Validators.min(0), Validators.max(10)]],
            ai_score: [0, [Validators.min(0), Validators.max(100)]], // Admin manual override for now?
            ai_explanation: ['']
        });
    }

    onImageChange(): void {
        const url = this.eventForm.get('poster_url')?.value;
        if (url) {
            this.previewImage.set(url);
        }
    }

    onSubmit(): void {
        if (this.eventForm.invalid) return;

        this.loading.set(true);
        const eventData = this.eventForm.value;

        this.eventsService.createEvent(eventData).subscribe({
            next: (event) => {
                this.loading.set(false);
                // Redirect to Show Management to immediately add shows
                this.router.navigate(['/admin/events', event._id, 'shows']);
            },
            error: (err) => {
                console.error('Create Event Error:', err);
                this.loading.set(false);
                alert('Failed to create event. Please try again.');
            }
        });
    }
}
