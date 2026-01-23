import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainsService, Train } from '../../../../core/services/trains.service';
import { finalize } from 'rxjs';

import { RouterModule } from '@angular/router';

import { LanguageService } from '../../../../core/services/language.service';

@Component({
    selector: 'app-train-reservation',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './train-reservation.html',
    styleUrls: ['./train-reservation.scss']
})
export class TrainReservation implements OnInit {
    destinations = [
        { id: 'alexandria', name: 'Alexandria', arName: 'الإسكندرية' },
        { id: 'luxor', name: 'Luxor', arName: 'الأقصر' },
        { id: 'aswan', name: 'Aswan', arName: 'أسوان' },
        { id: 'asyuit', name: 'Asyuit', arName: 'أسيوط' },
        { id: 'portsaid', name: 'Port Said', arName: 'بورسعيد' }
    ];

    selectedDestination = signal<string>('');
    selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
    trains = signal<Train[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor(
        private trainsService: TrainsService,
        public langService: LanguageService
    ) { }

    ngOnInit(): void { }

    onDestinationChange(): void {
        if (!this.selectedDestination()) {
            this.trains.set([]);
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        this.trainsService.getTrainsByDestination(this.selectedDestination())
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => {
                    this.trains.set(data);
                    setTimeout(() => this.scrollToResults(), 100);
                },
                error: (err) => {
                    console.error('Error fetching trains:', err);
                    this.error.set('Could not load train schedules. Please try again later.');
                    this.trains.set([]);
                }
            });
    }

    private scrollToResults(): void {
        const element = document.getElementById('results-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
