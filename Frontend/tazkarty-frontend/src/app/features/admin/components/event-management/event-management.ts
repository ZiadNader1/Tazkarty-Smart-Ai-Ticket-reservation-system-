// =====================================================
// FILE: src/app/features/admin/components/event-management/event-management.ts
// Event Management Component
// =====================================================

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin';
import { Event } from '../../../../models/event.model';

import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './event-management.html',
  styleUrls: ['./event-management.scss']
})
export class EventManagementComponent implements OnInit {
  events = signal<Event[]>([]);
  loading = signal(false);
  showModal = signal(false);
  editMode = signal(false);
  selectedEvent = signal<Event | null>(null);

  // Filters as Signals for Reactivity
  searchQuery = signal('');
  filterCity = signal('all');
  filterChampionship = signal('all');

  // Unique Cities and Championships
  uniqueCities = computed(() => {
    const stadiums = this.activeStadiums();
    const cities = new Set(stadiums.map((s: any) => s.city).filter(Boolean));
    return Array.from(cities).sort();
  });

  uniqueChampionships = ['Egyptian Premier League', 'Egypt Cup', 'Generic Match'];

  // Metadata for dropdowns
  categories = signal<any[]>([]);
  venues = signal<any[]>([]);
  stadiums = signal<any[]>([]);
  selectedStadiumHalls = signal<any[]>([]); // Sections/Halls for selected stadium

  // Computed signal for active stadiums only
  activeStadiums = computed(() => {
    return this.stadiums().filter(s => s.is_active);
  });

  // Teams List (Static for now, could be API)
  egyptianLeagueTeams = [
    'Al Ahly', 'Zamalek', 'Pyramids FC', 'Al Masry', 'Future FC',
    'Smouha', 'Ismaily', 'Al Ittihad', 'Enppi', 'Tala\'ea El Gaish',
    'Ceramica Cleopatra', 'National Bank of Egypt', 'Pharco FC',
    'El Gouna', 'Baladiyat El Mahalla', 'ZED FC'
  ];

  // Form fields
  eventForm = {
    title: '',
    description: '',
    type: 'sports' as 'movie' | 'concert' | 'sports' | 'show', // Default to sports as requested
    category_id: '',
    venue_id: '',
    stadium_id: '', // New field for Stadiums
    duration_minutes: 120, // Keep as legacy/optional
    poster_url: '',
    release_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    is_active: true,

    // Sports Specific
    championship_type: 'Generic' as 'League' | 'Cup' | 'Generic',
    home_team: '',
    away_team: '',
    gates_open_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    total_capacity: 0,
    home_capacity: 0,
    away_capacity: 0,
    layout_image: '', // Initialize string for URL display (upload is separate File)
    is_featured: false
  };


  selectedPoster: File | null = null;
  selectedLayoutImage: File | null = null; // New state for layout image

  constructor(
    private adminService: AdminService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadEvents();
    this.loadMetadata();
  }

  loadMetadata(): void {
    this.adminService.getEventCategories().subscribe({
      next: (cats) => {
        const categories = Array.isArray(cats) ? cats : (cats.categories || []);
        this.categories.set(Array.isArray(categories) ? categories : []);
        // Auto-select first category (or Sports if found) since we are hiding the dropdown
        if (this.categories().length > 0) {
          const sportsCat = this.categories().find((c: any) => c.name.toLowerCase().includes('sport') || c.name.toLowerCase().includes('football'));
          this.eventForm.category_id = sportsCat ? sportsCat._id : this.categories()[0]._id;
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.categories.set([]);
      }
    });

    this.adminService.getVenues().subscribe({
      next: (res) => {
        const venues = Array.isArray(res) ? res : (res.venues || []);
        this.venues.set(Array.isArray(venues) ? venues : []);
      },
      error: (err) => {
        console.error('Error loading venues:', err);
        this.venues.set([]);
      }
    });

    this.adminService.getStadiums().subscribe({
      next: (res) => {

        const stadiums = Array.isArray(res) ? res : (res.stadiums || []);
        this.stadiums.set(Array.isArray(stadiums) ? stadiums : []);
      },
      error: (err) => {
        console.error('Error loading stadiums:', err);
        this.stadiums.set([]);
      }
    });
  }

  loadEvents(): void {
    this.loading.set(true);
    this.adminService.getEvents().subscribe({
      next: (response) => {
        // Safe check for array
        // Backend might return { data: [], meta: {} } OR { events: [] } OR just []
        const eventsData = Array.isArray(response)
          ? response
          : (response.data || response.events || []);

        if (Array.isArray(eventsData)) {
          this.events.set(eventsData);
        } else {
          console.error('Invalid events data format:', response);
          this.events.set([]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.events.set([]);
        this.loading.set(false);
      }
    });
  }

  // Computed Signal for Filtering
  filteredEvents = computed(() => {
    let filtered = this.events();
    if (!Array.isArray(filtered)) {
      console.warn('filteredEvents: events() is not an array', filtered);
      return [];
    }

    // 1. Remove hardcoded sports filter to show all events if needed
    // If you strictly want sports only, uncomment next line, but user said "ruined/doesn't show"
    // filtered = filtered.filter(e => e.type === 'sports');

    // 2. Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        (e as any).championship_type?.toLowerCase().includes(query)
      );
    }

    // 3. City filter
    const city = this.filterCity();
    if (city !== 'all') {
      filtered = filtered.filter(e => {
        // Find stadium for this event
        const stadiumId = (e as any).stadium_id;
        const sId = typeof stadiumId === 'object' ? stadiumId?._id : stadiumId;
        const stadium = this.stadiums().find(s => s._id === sId);
        return stadium && stadium.city === city;
      });
    }

    // 4. Championship filter
    const champ = this.filterChampionship();
    if (champ !== 'all') {
      // Map display value to DB enum value if needed
      let dbValue = champ;
      if (champ === 'Egyptian Premier League') dbValue = 'League';
      else if (champ === 'Egypt Cup') dbValue = 'Cup';
      else if (champ === 'Generic Match') dbValue = 'Generic';

      filtered = filtered.filter(e => (e as any).championship_type === dbValue);
    }

    return filtered;
  });

  openCreateModal(): void {
    this.editMode.set(false);
    this.resetForm();
    this.showModal.set(true);
  }

  openEditModal(event: Event): void {
    this.editMode.set(true);
    this.selectedEvent.set(event);

    // Ensure we handle populated fields correctly (map object to ID if needed)
    const categoryId = typeof event.category_id === 'object' && event.category_id ? (event.category_id as any)._id : event.category_id;
    const venueId = typeof event.venue_id === 'object' && event.venue_id ? (event.venue_id as any)._id : event.venue_id;
    const stadiumId = (event as any).stadium_id ? (typeof (event as any).stadium_id === 'object' ? (event as any).stadium_id._id : (event as any).stadium_id) : '';

    this.eventForm = {
      title: event.title,
      description: event.description,
      type: event.type,
      category_id: categoryId || '',
      venue_id: venueId || '',
      stadium_id: stadiumId,
      duration_minutes: event.duration_minutes,
      poster_url: event.poster_url,
      release_date: event.release_date ? new Date(event.release_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      is_active: event.is_active,

      // Map potential extra fields if they exist on the interface (ignoring Type errors via cast if needed or ensuring interface update)
      championship_type: (event as any).championship_type || 'Generic',
      home_team: (event as any).home_team || '',
      away_team: (event as any).away_team || '',
      gates_open_at: (event as any).gates_open_at ? new Date((event as any).gates_open_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      total_capacity: (event as any).total_capacity || 0,
      home_capacity: (event as any).home_capacity || 0,
      away_capacity: (event as any).away_capacity || 0,
      layout_image: (event as any).layout_image || '', // Populate existing image if any
      is_featured: (event as any).is_featured || false
    };
    this.showModal.set(true);
  }


  closeModal(): void {
    this.selectedPoster = null;
    this.selectedLayoutImage = null;
    this.showModal.set(false);
    this.resetForm();
  }

  // File Selection Handler
  onPosterSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPoster = input.files[0];
    }
  }

  onLayoutImageSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedLayoutImage = input.files[0];
    }
  }

  resetForm(): void {
    this.eventForm = {
      title: '',
      description: '',
      type: 'sports', // Default
      category_id: '',
      venue_id: '',
      stadium_id: '',
      duration_minutes: 120,
      poster_url: '',
      release_date: new Date().toISOString().split('T')[0],
      is_active: true,
      championship_type: 'Generic',
      home_team: '',
      away_team: '',
      gates_open_at: new Date().toISOString().slice(0, 16),
      total_capacity: 0,
      home_capacity: 0,
      away_capacity: 0,
      layout_image: '',
      is_featured: false
    };

    // Auto-select category again if loaded
    const cats = this.categories();
    if (this.eventForm.category_id === '' && cats.length > 0) {
      const sportsCat = cats.find((c: any) => c.name.toLowerCase().includes('sport') || c.name.toLowerCase().includes('football'));
      this.eventForm.category_id = sportsCat ? sportsCat._id : cats[0]._id;
    }
  }

  saveEvent(): void {
    // Basic validation
    if (!this.eventForm.title || !this.eventForm.description) {
      alert(this.langService.translate('admin.fill_all_fields'));
      return;
    }

    // Parse numbers to ensure safety
    const homeCap = Number(this.eventForm.home_capacity) || 0;
    const awayCap = Number(this.eventForm.away_capacity) || 0;
    const totalCap = Number(this.eventForm.total_capacity) || 0;

    // Validation for Sports Events using Stadiums
    if (this.eventForm.type === 'sports') {
      if (!this.eventForm.stadium_id) {
        alert(this.langService.translate('admin.select_stadium_error'));
        return;
      }

      if (!this.eventForm.home_team || !this.eventForm.away_team) {
        alert(this.langService.translate('admin.select_teams_error'));
        return;
      }

      const selectedStadium = this.stadiums().find(s => s._id === this.eventForm.stadium_id);
      if (selectedStadium) {
        const totalRequired = totalCap || (homeCap + awayCap);

        // Validate Total Capacity against Stadium Capacity
        if (totalRequired > selectedStadium.capacity) {
          alert(this.langService.translate('admin.capacity_exceed_error'));
          return;
        }

        // Validate Sub-capacities sum (if provided explicitly)
        if (homeCap + awayCap > selectedStadium.capacity) {
          alert(this.langService.translate('admin.capacity_sum_error'));
          return;
        }
      }
    }

    if (this.editMode()) {
      // Update existing event
      const eventId = this.selectedEvent()?._id;
      if (eventId) {
        // Use FormData for update as well if poster is changed, strict compatibility
        const formData = new FormData();
        Object.keys(this.eventForm).forEach(key => {
          const value = (this.eventForm as any)[key];
          if (value !== null && value !== undefined) {
            formData.append(key, value instanceof Date ? value.toISOString() : value.toString());
          }
        });
        if (this.selectedPoster) {
          formData.append('poster', this.selectedPoster);
        }
        if (this.selectedLayoutImage) {
          formData.append('layout_image', this.selectedLayoutImage);
        }

        this.adminService.updateEvent(eventId, formData).subscribe({
          next: () => {
            alert(this.langService.translate('admin.event_update_success'));
            this.loadEvents();
            this.closeModal();
          },
          error: (err) => {
            console.error('Error updating event:', err);
            alert(this.langService.translate('admin.event_update_failed'));
          }
        });
      }
    } else {
      // Create new event
      const formData = new FormData();
      Object.keys(this.eventForm).forEach(key => {
        const value = (this.eventForm as any)[key];
        if (value !== null && value !== undefined) {
          formData.append(key, value instanceof Date ? value.toISOString() : value.toString());
        }
      });

      if (this.selectedPoster) {
        formData.append('poster', this.selectedPoster);
      }
      if (this.selectedLayoutImage) {
        formData.append('layout_image', this.selectedLayoutImage);
      }

      this.adminService.createEvent(formData).subscribe({
        next: () => {
          alert(this.langService.translate('admin.event_create_success'));
          this.loadEvents();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating event:', err);
          alert(this.langService.translate('admin.event_create_failed'));
        }
      });
    }
  }

  deleteEvent(eventId: string): void {
    if (confirm(this.langService.translate('admin.delete_confirm'))) {
      this.adminService.deleteEvent(eventId).subscribe({
        next: () => {
          alert(this.langService.translate('admin.event_delete_success'));
          this.loadEvents();
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          alert(this.langService.translate('admin.event_delete_failed'));
        }
      });
    }
  }



  getEventIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'movie': '🎬',
      'concert': '🎵',
      'sports': '⚽',
      'show': '🎭'
    };
    return icons[type] || '🎟️';
  }

  // Load sections/halls when stadium is selected
  onStadiumChange(stadiumId: string): void {
    if (!stadiumId) {
      this.selectedStadiumHalls.set([]);
      return;
    }

    // Fetch stadium details with halls

    this.adminService.getStadiumById(stadiumId).subscribe({
      next: (stadium) => {


        this.selectedStadiumHalls.set(stadium.halls || []);
      },
      error: (err) => {
        console.error('Error loading stadium sections:', err);
        this.selectedStadiumHalls.set([]);
      }
    });
  }
  // Helper to get stadium info for display
  getStadiumInfo(stadiumId: any): any {
    if (!stadiumId) return null;
    const sId = typeof stadiumId === 'object' ? stadiumId._id : stadiumId;
    return this.stadiums().find(s => s._id === sId);
  }
}