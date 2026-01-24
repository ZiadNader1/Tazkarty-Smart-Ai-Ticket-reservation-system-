import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventsService } from '../../../../core/services/events.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Event } from '../../../../models/event.model';
import { Show } from '../../../../models/show.model';
import { User } from '../../../../models/user.model';
import { LanguageService } from '../../../../core/services/language.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  standalone: true, // Ensure standalone is true
  imports: [CommonModule, RouterModule],
  templateUrl: './event-detail.html',
  styles: [`
    :host { display: block; }
  `]
})
export class EventDetail implements OnInit {
  event = signal<Event | null>(null);
  shows = signal<Show[]>([]);
  selectedShow = signal<Show | null>(null);
  loading = signal(true);
  loadingShows = signal(false);

  halls = signal<any[]>([]);

  // Booking State
  selectedSection = signal<any | null>(null);
  user = signal<User | null>(null);
  ticketCount = signal(1);
  discountCode = signal('');
  discountApplied = signal(false);

  get subtotal(): number {
    if (this.selectedSection()) {
      return (this.selectedSection().base_price || 0) * this.ticketCount();
    }
    return 0;
  }

  get total(): number {
    return this.subtotal; // Add discount logic if needed
  }

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private eventsService: EventsService,
    private authService: AuthService,
    public langService: LanguageService
  ) {
    // Initialize user
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.user.set(currentUser);
    }

    // Also subscribe in case it changes
    this.authService.user$.subscribe(u => {
      if (u) this.user.set(u);
    });
  }

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.loadEvent(eventId);
    } else {
      // Handle invalid ID, redirect or show error
      this.loading.set(false);
    }
  }

  loadEvent(eventId: string): void {
    this.loading.set(true);
    const isShowMode = this.route.snapshot.queryParamMap.get('is_show') === 'true';

    if (isShowMode) {
      // Independent Show Mode: Load Show and convert to Event-like structure
      this.eventsService.getShowById(eventId).subscribe({
        next: (show) => {



          // Extract venue from hall
          let venueData = null;
          if (show.hall_id && typeof show.hall_id === 'object') {
            const hall = show.hall_id as any;
            venueData = hall.venue_id; // This should be the populated venue object

          }

          // Create a "Virtual" Event from the Show
          const virtualEvent: any = {
            _id: show._id,
            title: show.title || 'Show Details',
            description: show.description || 'No description.',
            poster_url: this.formatPosterUrl(show.poster_url || ''),
            venue_id: venueData, // Use extracted venue
            type: 'show',
            is_active: show.is_active,
            release_date: show.start_time,
          };

          this.event.set(virtualEvent);
          this.loading.set(false);
          // Set the shows list to contain just this show
          this.shows.set([show]);
          this.loadingShows.set(false);
          this.selectedShow.set(show); // Auto-select since it's the only one
        },
        error: (err) => {
          console.error('Error loading show as event:', err);
          this.loading.set(false);
        }
      });
      return;
    }

    this.eventsService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
        // Load shows after event is confirmed
        this.loadShows(eventId);

        // If Sports Event, load stadium halls
        if (event.type === 'sports' && event.stadium_id) {
          const stadiumId = typeof event.stadium_id === 'object' ? event.stadium_id._id : event.stadium_id;
          this.loadStadiumHalls(stadiumId);
        }
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.loading.set(false);
      }
    });
  }

  loadShows(eventId: string): void {
    this.loadingShows.set(true);

    this.eventsService.getEventShows(eventId).subscribe({
      next: (shows) => {

        this.shows.set(shows);
        this.loadingShows.set(false);
      },
      error: (err) => {
        console.error('Error loading shows:', err);
        this.loadingShows.set(false);
      }
    });
  }

  loadStadiumHalls(stadiumId: string): void {
    this.eventsService.getStadiumHalls(stadiumId).subscribe({
      next: (halls) => {
        this.halls.set(halls);
      },
      error: (err) => console.error('Error loading stadium halls:', err)
    });
  }

  selectShow(show: Show): void {
    this.selectedShow.set(show);
  }

  proceedToBooking(): void {
    const show = this.selectedShow();
    if (show) {
      this.router.navigate(['/booking/seats', show._id]);
    }
  }

  bookSection(hall: any): void {
    this.selectedSection.set(hall);
    // Scroll to booking card
    setTimeout(() => {
      const bookingCard = document.getElementById('booking-card');
      if (bookingCard) {
        bookingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  updateTickets(change: number): void {
    const current = this.ticketCount();
    const newCount = current + change;
    if (newCount >= 1 && newCount <= 4) {
      this.ticketCount.set(newCount);
    }
  }

  applyDiscount(): void {
    if (!this.discountCode()) return;
    // Simulate API call for discount
    this.discountApplied.set(true);
    // alert('Discount code applied! (Simulation)');
  }

  proceedToPayment(): void {
    // For sports, we assume there is at least one active show (the match)
    const validShows = this.shows();


    if (validShows.length > 0) {
      const matchShow = validShows[0];
      const section = this.selectedSection(); // Get selected section

      // Prepare Query Params
      const queryParams: any = {
        count: this.ticketCount()
      };

      if (section) {
        queryParams.sectionId = section._id; // Assuming hall has _id
        queryParams.sectionName = section.name;
        queryParams.price = section.base_price;
      }



      // Navigate to booking/payment with params
      this.router.navigate(['/booking/seats', matchShow._id], { queryParams });
    } else {
      console.warn('No valid shows found. Event ID:', this.event()?._id);
      alert(`Debug: Ticket sales are not yet open. Shows found: ${validShows.length}. Please contact support.`);
    }
  }

  getVenueName(): string {
    const event = this.event();
    if (event) {
      // For sports events with stadium
      if (event.stadium_id && typeof event.stadium_id === 'object') {
        return (event.stadium_id as any).name;
      }
      // For regular events or independent shows with venue_id
      if (event.venue_id && typeof event.venue_id === 'object') {
        return (event.venue_id as any).name;
      }
    }
    return 'Venue';
  }

  getVenueLocation(): string {
    const event = this.event();
    if (event) {
      if (event.stadium_id && typeof event.stadium_id === 'object') {
        const stadium = event.stadium_id as any;
        return stadium.location || stadium.city || '';
      }
      if (event.venue_id && typeof event.venue_id === 'object') {
        const venue = event.venue_id as any;
        return venue.location || '';
      }
    }
    return '';
  }

  getStadiumLayoutImage(): string | null {
    const event = this.event();
    let url = null;

    // 1. Check if event has specific layout override
    if (event && event.layout_image) {
      url = event.layout_image;
    }
    // 2. Fallback to stadium's default layout
    else if (event && event.stadium_id && typeof event.stadium_id === 'object') {
      url = (event.stadium_id as any).layout_image || null;
    }

    if (url) {
      if (url.startsWith('http') && !url.includes('localhost:5000') && !url.includes('onrender.com')) {
        return url;
      }
      const filename = url.split('/').pop()?.split('\\').pop();
      return `${environment.uploadsUrl}/${filename}`;
    }
    return url;
  }

  private formatPosterUrl(url: string | undefined): string {
    if (!url) return 'assets/placeholder-event.svg';
    if (url.startsWith('http') && !url.includes('localhost:5000') && !url.includes('onrender.com')) {
      return url;
    }
    const filename = url.split('/').pop()?.split('\\').pop();
    return `${environment.uploadsUrl}/${filename}`;
  }
}