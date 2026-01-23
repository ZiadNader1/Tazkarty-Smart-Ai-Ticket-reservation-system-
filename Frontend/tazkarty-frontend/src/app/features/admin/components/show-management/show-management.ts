import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EventsService } from '../../../../core/services/events.service';
import { Show, Hall } from '../../../../models/show.model';
import { Event } from '../../../../models/event.model';
import { Venue } from '../../../../models/venue.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-show-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './show-management.html'
})
export class AdminShowManagement implements OnInit {
  eventId: string = '';
  event = signal<Event | null>(null);
  shows = signal<Show[]>([]);
  loading = signal(false);
  showForm: FormGroup;

  venues = signal<Venue[]>([]); // To be loaded from service
  halls = signal<Hall[]>([]); // New: Halls specific to selected venue
  selectedPoster: File | null = null; // New: Poster file state
  currentPosterUrl = signal<string | null>(null); // New: Display existing poster

  selectedHallHasMap = computed(() => {
    const hallId = this.showForm?.get('hall_id')?.value;
    if (!hallId) return false;
    const hall = this.halls().find(h => h._id === hallId);
    return hall && hall.seat_map_config && Object.keys(hall.seat_map_config).length > 0;
  });

  // Mode for Independent vs Linked Show
  // Mode for Independent vs Linked Show
  // mode = signal<'manual' | 'event'>('manual'); // Deprecated/Removed as per request

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private fb: FormBuilder
  ) {
    this.showForm = this.fb.group({
      title: [''], // For Independent Shows
      description: [''], // New Description Field
      event_id: [''], // For Linked Shows
      venue_id: ['', Validators.required],
      hall_id: ['', Validators.required],
      start_time: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      total_seats: [{ value: 0, disabled: true }, [Validators.required]],
      status: ['active', Validators.required]
    });

    // Listen to Venue changes to load Halls
    this.showForm.get('venue_id')?.valueChanges.subscribe(venueId => {
      if (venueId) {
        this.loadHalls(venueId);
        this.showForm.get('hall_id')?.reset();
      } else {
        this.halls.set([]);
      }
    });

    // Optional: Add validators dynamically based on mode if needed, but simple check in onSubmit is easier.

    // Listen to Hall changes to set Capacity
    this.showForm.get('hall_id')?.valueChanges.subscribe(hallId => {
      const hall = this.halls().find(h => h._id === hallId);
      if (hall) {
        this.showForm.patchValue({ total_seats: hall.capacity });
      }
    });
  }

  // Global mode: List of events to select from
  events = signal<Event[]>([]);

  ngOnInit(): void {
    // Get eventId from parent route (if available) or current route
    this.eventId = this.route.snapshot.paramMap.get('eventId') || this.route.snapshot.paramMap.get('id') || '';

    // Check parent if nested route
    if (!this.eventId && this.route.parent) {
      this.eventId = this.route.parent.snapshot.paramMap.get('id') || '';
    }



    this.loadVenues();

    if (this.eventId) {
      this.loadEvent();
      this.loadShows();
    } else {
      // Global mode: Load all events for selection
      this.loadAllEvents();
      this.loadShows(); // Fix: Load all shows in global mode
    }
  }

  loadAllEvents(): void {
    // reuse eventsService.getEvents but we need a simplified list or paginated?
    // Let's just get the first page or search?
    // For now, let's try to get a reasonable number of recent events
    this.eventsService.getEvents({ limit: 100, sort: 'date' }).subscribe(res => {
      this.events.set(res.data);
    });
  }

  loadEvent(): void {
    this.eventsService.getEventById(this.eventId).subscribe(event => this.event.set(event));
  }

  loadShows(): void {
    this.loading.set(true);
    // If we have eventId, get shows for that event
    if (this.eventId) {
      this.eventsService.getEventShows(this.eventId).subscribe({
        next: (shows) => {
          this.shows.set(shows);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      // Global Mode: Get All Shows
      this.eventsService.getAllShows().subscribe({
        next: (shows) => {
          this.shows.set(shows);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading all shows:', err);
          this.loading.set(false);
        }
      });
    }
  }

  loadVenues(): void {

    this.loading.set(true);
    this.eventsService.getVenues().subscribe({
      next: (venues) => {

        this.venues.set(venues);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('AdminShowManagement: error loading venues', err);
        this.loading.set(false);
        alert('Error loading venues: ' + (err.error?.message || err.message));
      }
    });
  }

  loadHalls(venueId: string): void {
    this.eventsService.getVenueHalls(venueId).subscribe(halls => this.halls.set(halls));
  }

  // Editing State
  editingShowId = signal<string | null>(null);

  onEdit(show: Show): void {
    this.editingShowId.set(show._id);

    // Mode setting removed
    // if (show.event_id) { ... } else { ... }

    // Load Halls for the venue so the hall selector works/populates correctly
    // We need to do this before patching value or simultaneously
    let currentVenueId = '';

    // Extract Venue ID from Hall if available (since show doesn't have venue_id directly)
    if (show.hall_id && typeof show.hall_id === 'object' && 'venue_id' in show.hall_id) {
      const hall = show.hall_id as unknown as Hall;
      currentVenueId = (typeof hall.venue_id === 'object') ? (hall.venue_id as any)._id : hall.venue_id;
    }

    if (currentVenueId) {
      this.loadHalls(currentVenueId);
    }

    // Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedDate = '';
    if (show.start_time) {
      const date = new Date(show.start_time);
      // Adjust to local ISO string
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      formattedDate = date.toISOString().slice(0, 16);
    }

    this.showForm.patchValue({
      title: show.title || '',
      description: show.description || '', // New
      event_id: (typeof show.event_id === 'object') ? (show.event_id as any)?._id : show.event_id,
      venue_id: currentVenueId,
      hall_id: (typeof show.hall_id === 'object') ? (show.hall_id as any)._id : show.hall_id,
      start_time: formattedDate,
      price: show.price,
      total_seats: show.total_seats,
      status: show.is_active ? 'active' : 'hidden'
    });

    if (show.poster_url) {
      this.currentPosterUrl.set(show.poster_url);
    } else {
      this.currentPosterUrl.set(null);
    }

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingShowId.set(null);
    this.showForm.reset({
      venue_id: '',
      hall_id: '',
      status: 'active'
    });
    this.selectedPoster = null;
    this.currentPosterUrl.set(null);
    this.halls.set([]);
  }

  onDelete(show: Show): void {
    if (!confirm(`Are you sure you want to delete "${show.title || 'this show'}"?`)) return;

    this.loading.set(true);
    this.eventsService.deleteShow(show._id).subscribe({
      next: () => {
        this.shows.update(list => list.filter(s => s._id !== show._id));
        this.loading.set(false);
        // If we were editing this show, cancel edit
        if (this.editingShowId() === show._id) {
          this.cancelEdit();
        }
        alert('Show deleted successfully.');
      },
      error: (err) => {
        console.error('Delete Show Error:', err);
        this.loading.set(false);
        alert('Failed to delete show.');
      }
    });
  }

  onSubmit(): void {
    if (this.showForm.invalid) return;

    this.loading.set(true);
    const formValue = this.showForm.getRawValue();

    // Determine Event ID: Either from URL (this.eventId) or Form Selection
    const targetEventId = this.eventId; // Only use URL ID if present (nested). We removed manual linking.
    const targetTitle = formValue.title;

    if (!targetEventId && !targetTitle) {
      alert('Please provide a Show Title.');
      this.loading.set(false);
      return;
    }

    const start = new Date(formValue.start_time);
    const duration = this.event()?.duration_minutes || 120; // Default if event not loaded fully
    const end = new Date(start.getTime() + duration * 60000);

    const showData: any = {
      ...formValue,
      end_time: end,
      available_seats: formValue.total_seats,
      is_active: formValue.status === 'active' // Map status string back to boolean if needed
    };

    // Explicitly handle event_id and title to avoid sending empty strings
    if (targetEventId) {
      showData.event_id = targetEventId;
    } else {
      delete showData.event_id;
    }

    if (targetTitle) {
      showData.title = targetTitle;
    }

    // Use FormData for File Upload
    const formData = new FormData();
    // Append all basic fields
    Object.keys(showData).forEach(key => {
      // Skip null/undefined
      if (showData[key] !== null && showData[key] !== undefined) {
        // Handle Date objects explicitly if needed or let standard string conversion happen
        if (key === 'start_time' || key === 'end_time') {
          formData.append(key, new Date(showData[key]).toISOString());
        } else {
          formData.append(key, showData[key]);
        }
      }
    });

    if (this.selectedPoster) {
      formData.append('poster', this.selectedPoster);
    }

    // UPDATE EXISTING SHOW
    if (this.editingShowId()) {
      this.eventsService.updateShow(this.editingShowId()!, formData).subscribe({
        next: (updatedShow) => {
          // Update list locally
          this.shows.update(list => list.map(s => s._id === updatedShow._id ? updatedShow : s));
          this.loading.set(false);
          alert('Show updated successfully!');
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Update Show Error:', err);
          this.loading.set(false);
          alert('Failed to update show: ' + (err.error?.message || err.message));
        }
      });
      return;
    }

    // CREATE NEW SHOW
    this.eventsService.createShow(targetEventId || null, formData).subscribe({
      next: (show) => {
        // Add to list if we are listing them
        this.shows.update(s => [...s, show]);

        const currentVenue = formValue.venue_id;
        const currentEvent = formValue.event_id; // Keep event selected if global

        this.showForm.reset({
          event_id: currentEvent,
          venue_id: currentVenue,
          status: 'active'
        });
        this.selectedPoster = null; // Reset Poster
        this.loading.set(false);
        alert('Show created successfully!');
      },
      error: (err) => {
        console.error('Create Show Error:', err);
        this.loading.set(false);
        const msg = err.error?.message || err.message || 'Unknown error';
        const detail = err.error?.detailed ? JSON.stringify(err.error.detailed) : '';
        alert(`Failed to create show.\n${msg}\n${detail}`);
      }
    });
  }

  onPosterSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedPoster = file;
    }
  }
  // Filtering
  searchQuery = signal('');

  filteredShows = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.shows().filter(show => {
      // Exclude Sports
      if (show.event_id && typeof show.event_id === 'object') {
        const evt = show.event_id as any;
        if (evt.type === 'sports' || evt.category === 'Football' || evt.category === 'Sports') {
          return false;
        }
      }

      const title = (show.title || (show.event_id && typeof show.event_id === 'object' ? (show.event_id as any).title : '') || '').toLowerCase();
      const hallName = this.getHallName(show).toLowerCase();
      return title.includes(query) || hallName.includes(query);
    });
  });

  hasSeatMap(show: Show): boolean {
    if (show.hall_id && typeof show.hall_id === 'object') {
      const hall = show.hall_id as any;
      // Check if seat_map_config exists and has keys (is not empty)
      return hall.seat_map_config && Object.keys(hall.seat_map_config).length > 0;
    }
    return false;
  }

  getHallName(show: Show): string {
    if (show.hall_id && typeof show.hall_id === 'object') {
      const hall = show.hall_id as any;
      const venueName = hall.venue_id && typeof hall.venue_id === 'object' ? hall.venue_id.name : 'Unknown Venue';
      return `${venueName} - ${hall.name}`;
    }
    return 'Main Hall';
  }

  getHallCategories(show: Show): any[] {
    if (show.hall_id && typeof show.hall_id === 'object' && 'seat_categories' in show.hall_id) {
      return (show.hall_id as any).seat_categories || [];
    }
    return [];
  }

  getHallCapacity(show: Show): number {
    if (show.hall_id && typeof show.hall_id === 'object' && 'capacity' in show.hall_id) {
      return (show.hall_id as any).capacity || 0;
    }
    return 0;
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.socketUrl}/${path}`;
  }
}
