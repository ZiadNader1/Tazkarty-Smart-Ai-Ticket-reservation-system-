import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainsService, TrainAvailability, TrainCarriage } from '../../../../core/services/trains.service';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs';
import { LanguageService } from '../../../../core/services/language.service';

interface SelectedSeat {
    carriage: number;
    seat: string;
    price: number;
    class: string;
}

@Component({
    selector: 'app-train-booking',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './train-booking.html',
    styleUrls: ['./train-booking.scss']
})
export class TrainBooking implements OnInit {
    trainNumber = signal<string>('');
    trainType = signal<string>('');
    departureCity = signal<string>('Cairo');
    destinationCity = signal<string>('');

    selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
    availability = signal<TrainAvailability | null>(null);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    selectedCarriageIndex = signal<number>(0);
    selectedSeats = signal<SelectedSeat[]>([]);

    nationalId = signal<string>('');
    phoneNumber = signal<string>('');
    userName = signal<string>('');

    totalPrice = computed(() => this.selectedSeats().reduce((sum, s) => sum + s.price, 0));

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private trainsService: TrainsService,
        private authService: AuthService,
        public langService: LanguageService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.trainNumber.set(params['trainNumber']);
        });

        this.route.queryParams.subscribe(params => {
            this.trainType.set(params['type'] || 'AC');
            this.destinationCity.set(params['to'] || '');
            if (params['date']) {
                this.selectedDate.set(params['date']);
            }
        });

        // Load user data
        const user = this.authService.currentUser();
        if (user) {
            this.userName.set(user.name);
            this.phoneNumber.set(user.phone || '');
            this.nationalId.set((user as any).national_id || '');
        }

        this.loadAvailability();
    }

    loadAvailability(): void {
        if (!this.trainNumber() || !this.selectedDate()) return;

        this.loading.set(true);
        this.error.set(null);

        this.trainsService.getTrainAvailability(this.trainNumber(), this.trainType(), this.selectedDate())
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => this.availability.set(data),
                error: (err) => {
                    console.error('Error loading availability:', err);
                    this.error.set(this.langService.translate('trains.error_load_availability'));
                }
            });
    }

    onDateChange(): void {
        this.selectedSeats.set([]);
        this.loadAvailability();
    }

    getSeatLabel(rowIdx: number, colIdx: number): string {
        return `${rowIdx + 1}${String.fromCharCode(65 + colIdx)}`;
    }

    selectCarriage(index: number): void {
        this.selectedCarriageIndex.set(index);
    }

    isSeatOccupied(carriageNum: number, seatLabel: string): boolean {
        return this.availability()?.occupied.some(o => o.carriage === carriageNum && o.seat === seatLabel) || false;
    }

    isSeatSelected(carriageNum: number, seatLabel: string): boolean {
        return this.selectedSeats().some(s => s.carriage === carriageNum && s.seat === seatLabel);
    }

    toggleSeat(carriage: TrainCarriage, rowIdx: number, colIdx: number): void {
        const seatLabel = `${rowIdx + 1}${String.fromCharCode(65 + colIdx)}`;

        if (this.isSeatOccupied(carriage.number, seatLabel)) return;

        const current = this.selectedSeats();
        const index = current.findIndex(s => s.carriage === carriage.number && s.seat === seatLabel);

        if (index > -1) {
            this.selectedSeats.set(current.filter((_, i) => i !== index));
        } else {
            if (current.length >= 4) {
                alert(this.langService.translate('trains.max_seats_alert'));
                return;
            }
            this.selectedSeats.set([...current, {
                carriage: carriage.number,
                seat: seatLabel,
                price: carriage.price,
                class: carriage.class
            }]);
        }
    }

    confirmBooking(): void {
        if (this.selectedSeats().length === 0) {
            alert(this.langService.translate('trains.select_seat_alert'));
            return;
        }

        if (!this.nationalId()) {
            alert(this.langService.translate('trains.id_required_alert'));
            return;
        }

        this.loading.set(true);

        const bookingData = {
            train_number: this.trainNumber(),
            train_type: this.trainType(),
            departure_city: this.departureCity(),
            destination_city: this.destinationCity(),
            departure_time: 'Scheduled', // We can get this from query params if needed
            travel_date: this.selectedDate(),
            seats: this.selectedSeats().map(s => ({
                carriage: s.carriage,
                seat: s.seat,
                price: s.price
            })),
            national_id: this.nationalId(),
            passengers: [{
                name: this.userName(),
                national_id: this.nationalId()
            }]
        };

        this.trainsService.createBooking(bookingData)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    this.router.navigate(['/booking/payment', res.booking._id]);
                },
                error: (err) => {
                    alert(err.error?.message || this.langService.translate('trains.booking_failed_alert'));
                }
            });
    }
}
