import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookingService } from '../../../../core/services/booking.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Seat } from '../../../../models/seat.model';
import { SeatMap } from '../../../../shared/components/seat-map/seat-map';
import { SeatMapConfig } from '../../../../core/models/seat-map.types';
import { InteractionEvent } from '../../../../shared/components/seat-renderer/seat-renderer.types';
import { QRCodeComponent } from 'angularx-qrcode';
import { BookingStepperComponent } from '../../../../shared/components/booking-stepper/booking-stepper.component';
import { LanguageService } from '../../../../core/services/language.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, SeatMap, QRCodeComponent, BookingStepperComponent],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss'
})
export class SeatSelection implements OnInit, OnDestroy {
  showId = '';
  loading = signal(true);

  // Seat Map Configuration
  config = signal<SeatMapConfig | null>(null);
  seatStatus = signal<Map<string, string>>(new Map());

  // Legacy support for logic until fully refactored
  seats = signal<Seat[]>([]);

  selectedSeats = signal<string[]>([]);
  pricePerSeat = 0;
  lockExpiresIn = signal(0);

  // Context
  showDetails = signal<any>(null);

  // New Signals for Requirements
  isSoldOut = computed(() => {
    const allSeats = this.seats();
    return allSeats.length > 0 && allSeats.every(s => s.status === 'booked' || s.status === 'sold');
  });

  // Sports / Section Mode Signals
  isSportsMode = signal(false);
  sectionDetails = signal<{ id: string, name: string, price: number, count: number } | null>(null);

  currentUser = signal<any>(null);

  gatesOpenTime = computed(() => {
    const show = this.showDetails();
    if (!show || !show.start_time) return null;
    const date = new Date(show.start_time);
    date.setHours(date.getHours() - 5);
    return date;
  });

  qrData = computed(() => {
    const part1 = this.showId.substring(0, 6);
    const part2 = this.sectionDetails()?.id.substring(0, 6) || 'GENERAL';
    const userId = this.currentUser()?._id?.substring(0, 6) || 'GUEST';
    const timestamp = Date.now().toString().substring(8);
    return `TZK-${part1}-${part2}-${userId}-${timestamp}`;
  });

  sportsSeatGuide = computed(() => {
    const sectionName = this.langService.translate(this.sectionDetails()?.name || 'common.general');
    return this.langService.translate('booking.sports_seat_guide').replace('section', `<strong>${sectionName}</strong>`);
  });

  private timerInterval: any;
  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private bookingService: BookingService,
    private authService: AuthService,
    public langService: LanguageService
  ) {
    // Effect to monitor timer
    effect(() => {
      if (this.lockExpiresIn() === 60) {
        console.warn('Seat lock expiring in 1 minute!');
      }
    });
  }

  // Group seats by row_label for display
  seatRows = computed(() => {
    const allSeats = this.seats();
    if (allSeats.length === 0) return [];

    // Distinct rows, assume they come sorted or we sort them
    const rows = [...new Set(allSeats.map(s => s.row_label))].sort();

    return rows.map(label => ({
      label,
      seats: allSeats.filter(s => s.row_label === label).sort((a, b) => {
        // Try numeric sort of seat_label if possible, else string
        const numA = parseInt(a.seat_label);
        const numB = parseInt(b.seat_label);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.seat_label.localeCompare(b.seat_label);
      })
    }));
  });

  totalPrice = computed(() => {
    // Calculate based on specific seat price (which might vary by tier)
    // Legacy: this.pricePerSeat. New: seat.price
    const selectedIds = this.selectedSeats();
    const seats = this.seats().filter(s => selectedIds.includes(s.seat_id));
    const seatPrice = seats.reduce((sum, s) => sum + s.price, 0);
    const fees = selectedIds.length * 2;
    return seatPrice + fees;
  });

  ngOnInit(): void {
    // Initialize User
    this.currentUser.set(this.authService.currentUser());

    this.showId = this.route.snapshot.paramMap.get('showId') || '';

    // Check for Sports Section Params or Restore Ticket
    this.route.queryParams.subscribe(params => {
      if (params['sectionId']) {
        this.isSportsMode.set(true);
        this.sectionDetails.set({
          id: params['sectionId'],
          name: params['sectionName'],
          price: parseFloat(params['price']),
          count: parseInt(params['count'] || '1')
        });

      } else if (params['restoreTicketId']) {
        // Restore selection from pending ticket
        const mode = params['restoreMode'];
        if (mode === 'auto') {
          // We will attempt to auto-detect in restoreTicket/loadShowDetails
          // But we can also set a flag if we want to be aggressive
        }
        this.restoreTicket(params['restoreTicketId']);
      }
    });

    if (this.showId) {
      this.loadShowDetails();
      // Only load seats if we are NOT yet sure it's sports mode? 
      // Or always load them? In sports mode we verify availability via autoSelect.
      this.loadSeats();

      // For sports, we don't need frequent refresh of map, but we might need to hold seats.
      if (!this.isSportsMode()) {
        this.refreshInterval = setInterval(() => this.loadSeats(true), 30000);
      }
    } else {
      this.router.navigate(['/events']);
    }
  }

  restoreTicket(ticketId: string): void {
    this.bookingService.getBookingById(ticketId).subscribe({
      next: (ticket: any) => {
        if (ticket && ticket.seats) {
          const seatIds = ticket.seats.map((s: any) => s._id || s);

          this.selectedSeats.set(seatIds);

          // CRITICAL: Restore Sports Mode View if applicable
          // Wait for show details to load to confirm event type
          // If show details already loaded (likely), check immediately
          if (this.showDetails()) {
            this.checkRestoreSportsMode(ticket);
          }
          // Note: If showDetails is NOT loaded yet, the logic in loadShowDetails' subscribe 'next' block
          // should handle it because we added logic there too (step 176 change). 

          this.updateStatusMap();
        }
      },
      error: (err) => console.error('Failed to restore ticket:', err)
    });
  }

  // New helper to infer mode
  checkRestoreSportsMode(ticket: any) {
    const show = this.showDetails();
    // If event type is sports or we have "Section" params in the original URL (which we don't here).
    // Let's look at the ticket structure.
    // If we have valid seats and it IS a sports event, show the sports ticket view.
    // How do we know it is a sports event?
    // show.event.type === 'sports' ?

    const isSports = show?.event?.type === 'sports' || show?.event?.category === 'Sports';
    if (isSports) {
      this.isSportsMode.set(true);
      // We need Section Details to render the ticket! 
      // Use 'General' or try to get from first seat row/label
      this.sectionDetails.set({
        id: 'restored',
        name: 'Restored Section', // Ideally fetch from seat metadata
        price: ticket.price_per_seat || 0,
        count: ticket.seats.length
      });
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadShowDetails(): void {
    this.bookingService.getShowById(this.showId).subscribe({
      next: (show) => {
        this.showDetails.set(show);

        // If we have a pending ticket restore, check if valid now
        if (this.selectedSeats().length > 0 && !this.isSportsMode()) {
          // Heuristic to restore view
          const isSports = show?.event?.type === 'sports' || show?.event?.category === 'Sports' || (show?.event?.stadium_id);
          // If stadium_id exists, it's likely sports
          if (isSports) {
            this.isSportsMode.set(true);
            // Mock section details since we lost them in navigation (unless we pass them back and forth)
            // Improved: Try to find common section from seats if loaded?
            this.sectionDetails.set({
              id: 'restored',
              name: 'Your Section',
              price: 0, // Recalculated anyway
              count: this.selectedSeats().length
            });
          }
        }

        if (show.hall_id && typeof show.hall_id === 'object' && show.hall_id._id) {
          this.loadHallConfig(show.hall_id._id);
        } else if (show.hall_id && typeof show.hall_id === 'string') {
          this.loadHallConfig(show.hall_id);
        }
      },
      error: (err) => console.error('Error loading show details', err)
    });
  }

  loadHallConfig(hallId: string): void {
    this.bookingService.getHallConfig(hallId).subscribe({
      next: (hall) => {
        if (hall.seat_map_config) {
          this.config.set(hall.seat_map_config);
        }
        // Once config is ready, load availability status
        this.loadSeats();
      },
      error: (err) => console.error('Error loading hall config', err)
    });
  }

  loadSeats(silent = false): void {
    if (!silent) this.loading.set(true);

    this.bookingService.getAvailableSeats(this.showId).subscribe({
      next: (response) => {
        // Map response items to ensure seat_id exists (use config ID if available!)
        const mappedSeats = response.seats.map((s: any) => ({
          ...s,
          // CRITICAL: Use the config ID for frontend logic (matching the canvas), but keep _id for booking
          seat_id: s.seat_config_id || s._id
        }));
        this.seats.set(mappedSeats);

        // Transform Array Status to Map for Renderer
        const statusMap = new Map<string, string>();
        mappedSeats.forEach((s: any) => {
          statusMap.set(s.seat_id, s.status);
        });

        // Also overlay local selection
        this.selectedSeats().forEach(id => {
          statusMap.set(id, 'selected');
        });

        this.seatStatus.set(statusMap);

        // AUTO-SELECT for Sports Mode
        if (this.isSportsMode() && this.selectedSeats().length === 0) {
          this.autoSelectSportsSeats(mappedSeats);
        }

        if (!silent) this.loading.set(false);

        const remainingTime = this.bookingService.getRemainingLockTime();
        if (remainingTime > 0) {
          this.lockExpiresIn.set(remainingTime);
          this.startCountdown();
        }
      },
      error: (err) => {
        console.error('Error loading seats:', err);
        if (!silent) this.loading.set(false);
      }
    });
  }

  autoSelectSportsSeats(seats: Seat[]) {
    const details = this.sectionDetails();
    if (!details) return;

    // Filter available seats
    // Ideally check matching Hall/Section ID if seat model supports it.
    // For now, pick ANY available seats since we likely only have one hall linked OR general admission.
    const available = seats.filter(s => s.status === 'available');

    if (available.length >= details.count) {
      // Use _id because that's what the backend expects for booking
      const toSelect = available.slice(0, details.count).map(s => s._id || s.seat_id);
      // @ts-ignore
      this.selectedSeats.set(toSelect);

    } else {
      console.warn('Not enough available seats for this section!');
      if (available.length > 0) {
        // Select what is available?
        // @ts-ignore
        this.selectedSeats.set(available.map(s => s._id || s.seat_id));
      } else {
        alert(this.langService.translate('booking.sold_out_alert'));
      }
    }
  }

  onSeatClick(event: InteractionEvent): void {
    if (event.type === 'click' && event.seat) {
      const seatId = event.seat.id;
      const currentStatus = this.seatStatus().get(seatId);

      // If it's booked, sold, or invalid, ignore
      if (currentStatus === 'booked' || currentStatus === 'sold') return;

      this.toggleSeatSelection(seatId, event.seat.label);
    }
  }

  toggleSeatSelection(seatId: string, label: string): void {
    const selected = this.selectedSeats();
    const index = selected.indexOf(seatId);

    if (index > -1) {
      // Deselect
      this.selectedSeats.update(seats => seats.filter(id => id !== seatId));
    } else {
      // Select
      if (selected.length < 10) {
        this.selectedSeats.set([...selected, seatId]);
      } else {
        alert(this.langService.translate('booking.max_seats_alert'));
      }
    }

    // Update the visual map
    this.updateStatusMap();
  }

  updateStatusMap() {
    // Re-merge API status with Selection
    // We need to preserve the base status from the last API call
    // This is a bit inefficient to re-build every click but robust.
    const statusMap = new Map<string, string>();

    this.seats().forEach(s => {
      statusMap.set(s.seat_id, s.status);
    });

    this.selectedSeats().forEach(id => {
      statusMap.set(id, 'selected');
    });

    this.seatStatus.set(statusMap);
  }

  removeSeat(seatId: string): void {
    this.toggleSeatSelection(seatId, '');
  }

  // Helper to maintain compatibility with template that might use getSeatLabel
  getSeatLabel(seatId: string): string {
    // Try to find in seat list first
    const seat = this.seats().find(s => s.seat_id === seatId);
    if (seat) return `${seat.row_label}${seat.seat_label}`;

    // Fallback if seat not found yet
    // Could happen during loading or if seat list is incomplete
    return 'Seat ' + seatId.substring(seatId.length - 4);
  }

  isSelected(seatId: string): boolean {
    return this.selectedSeats().includes(seatId);
  }

  startCountdown(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const current = this.bookingService.getRemainingLockTime();
      this.lockExpiresIn.set(current);

      if (current <= 0) {
        clearInterval(this.timerInterval);
        this.handleSessionExpired();
      }
    }, 1000);
  }

  handleSessionExpired(): void {
    alert(this.langService.translate('booking.session_expired_alert'));
    this.selectedSeats.set([]);
    this.loadSeats(); // Refresh to show current state
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onImageError(event: any) {
    // Fallback to a clear data URI if the asset fails to load
    // This looks like a simple stadium icon
    event.target.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23ccc'%3E%3Crect x='10' y='20' width='80' height='60' rx='5' /%3E%3Cpath d='M20 30 h60 v40 h-60 z' fill='white'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-family='Arial' font-size='10' fill='%23999'%3EStadium Layout%3C/text%3E%3C/svg%3E";
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;

    // Fix paths like uploads/image.png
    const cleanPath = imagePath.startsWith('uploads/') ? imagePath.replace('uploads/', '') : imagePath;
    return `${environment.uploadsUrl}/${cleanPath.replace(/\\/g, '/')}`;
  }

  getDisplayLayoutImage(): string {
    const show = this.showDetails();
    if (!show) return 'assets/placeholder-event.svg';

    let imagePath = null;

    // 1. Check Event specific override
    if (show.event?.layout_image) {
      imagePath = show.event.layout_image;
    }
    // 2. Check Stadium default layout (if populated)
    else if (show.event?.stadium_id && typeof show.event.stadium_id === 'object') {
      // @ts-ignore
      imagePath = show.event.stadium_id.layout_image;
    }

    if (imagePath) {

      return this.getImageUrl(imagePath);
    }

    console.warn('No layout image found in Event or Stadium data');
    return 'assets/placeholder-event.svg';
  }

  getEventId(): string {
    const show = this.showDetails();
    if (!show) return '';
    // Handle both populated object and raw ID
    if (show.event && typeof show.event === 'object' && show.event._id) {
      return show.event._id;
    }
    // Fallback if event is just an ID (unlikely with current populate, but safe)
    if (show.event && typeof show.event === 'string') {
      return show.event;
    }
    // Fallback to event_id if schema differs
    if (show.event_id && typeof show.event_id === 'object' && show.event_id._id) {
      return show.event_id._id;
    }
    return show.event_id || '';
  }

  proceedToPayment(): void {
    if (this.selectedSeats().length === 0) return;

    // Auth Check
    if (!this.authService.isLoggedIn()) {
      if (confirm(this.langService.translate('booking.login_required_confirm'))) {
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/booking/seats/' + this.showId } });
      }
      return;
    }

    this.loading.set(true);

    // Translate Visual IDs (Config IDs) to Backend IDs (Mongo _id)
    const backendIds = this.selectedSeats().map(visualId => {
      const seat = this.seats().find(s => s.seat_id === visualId);
      return (seat && seat._id) ? seat._id : visualId;
    });

    this.bookingService.createBooking({
      show_id: this.showId,
      seatIds: backendIds
    }).subscribe({
      next: (response) => {
        // Timer starts officially here from backend response
        this.startCountdown();

        // Pass forward the sports parameters if they exist
        const queryParams: any = {};
        if (this.isSportsMode() && this.sectionDetails()) {
          const d = this.sectionDetails();
          queryParams['sectionId'] = d?.id;
          queryParams['sectionName'] = d?.name;
          queryParams['price'] = d?.price;
          queryParams['count'] = d?.count;
        }

        this.router.navigate(['/booking/payment', response.ticket._id], { queryParams });
      },
      error: (err) => {
        console.error('Booking error:', err);
        this.loading.set(false);
        this.loadSeats(); // Refresh in case of double booking
        alert(err.error?.message || this.langService.translate('booking.booking_failed_alert'));
      }
    });
  }

  goBack(): void {
    const category = this.isSportsMode() ? 'sports' : 'entertainment';
    this.router.navigate(['/events'], { queryParams: { category } });
  }
}