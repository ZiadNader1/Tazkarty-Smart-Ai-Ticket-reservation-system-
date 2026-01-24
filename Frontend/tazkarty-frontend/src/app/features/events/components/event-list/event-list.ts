import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { EventFilters } from '../event-filters/event-filters';
import { EventCard } from '../event-card/event-card';
import { EventsService } from '../../../../core/services/events.service';
import { Event, EventFilter, EventsResponse } from '../../../../models/event.model';
import { ViewportScroller } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule, EventFilters, EventCard],
  templateUrl: './event-list.html',
  styles: []
})
export class EventList implements OnInit {
  events = signal<Event[]>([]);
  loading = signal(true);

  // State
  viewMode: 'grid' | 'list' = 'list';
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;
  activeFilter: EventFilter = {};

  // Sports Filter Options
  teams = signal<string[]>([]);
  stadiums = signal<string[]>([]);
  tournamentTypes = signal<string[]>([]);
  private filtersLoaded = false;

  get isSportsView(): boolean {
    return this.activeFilter.category === 'sports';
  }

  get isEntertainmentView(): boolean {
    return this.activeFilter.category?.toLowerCase() === 'entertainment';
  }

  get activeTags(): string[] {
    const tags = [];
    if (this.activeFilter.category && !this.isSportsView) {
      tags.push(`${this.langService.translate('events.tag.category')}: ${this.langService.translate('nav.' + this.activeFilter.category.toLowerCase())}`);
    }
    if (this.activeFilter.venue) {
      tags.push(this.langService.translate('events.tag.venue'));
    }
    if (this.activeFilter.query) {
      tags.push(`${this.langService.translate('events.tag.search')}: "${this.activeFilter.query}"`);
    }

    // Sports specific tags
    if (this.activeFilter.team) {
      tags.push(`${this.langService.translate('events.tag.team')}: ${this.langService.translate('team.' + this.activeFilter.team)}`);
    }
    if (this.activeFilter.stadium) {
      tags.push(`${this.langService.translate('events.tag.stadium')}: ${this.langService.translate('stadium.' + this.activeFilter.stadium)}`);
    }
    if (this.activeFilter.championship_type) {
      tags.push(`${this.langService.translate('events.tag.tournament')}: ${this.langService.translate('tournament.' + this.activeFilter.championship_type)}`);
    }

    return tags;
  }

  constructor(
    private eventsService: EventsService,
    private route: ActivatedRoute,
    private router: Router,
    private scroller: ViewportScroller,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    // Initial load handled by EventFilters emitting initial state from URL
    // If we are in sports view directly via URL, we might need to handle init here if EventFilters doesn't fire immediately or if we bypass it.
    // However, usually EventFilters is present. If we hide EventFilters in CSS for sports view, we need to ensure we still load.
    // For now, valid to assume we get a trigger or we trigger manually if param exists.
    this.route.queryParams.subscribe(params => {
      // Sync URL to Local State
      this.activeFilter = {
        category: params['category'] || '',
        query: params['q'] || '',
        venue: params['venue'] || '',
        team: params['team'] || '',
        stadium: params['stadium'] || '',
        championship_type: params['championship_type'] || '',
        sort: params['sort'] || 'date',
        page: params['page'] ? parseInt(params['page']) : 1
      };

      if (!this.activeFilter.category && !this.activeFilter.query) {
        // If we land on /events without a category or a search query, redirect to home
        // (This effectively "removes" the general /events page)
        this.router.navigate(['/home']);
        return;
      }

      this.currentPage = this.activeFilter.page || 1;

      if (this.isSportsView && !this.filtersLoaded) {
        this.loadAllSportsOptions();
      }

      // Load events
      this.executeLoadEvents();
    });
  }

  private loadAllSportsOptions(): void {
    const request: EventFilter = { category: 'sports', limit: 100 };
    this.eventsService.getEvents(request).subscribe({
      next: (response) => {
        this.extractSportsFilterOptions(response.data);
        this.filtersLoaded = true;
      }
    });
  }

  onFilterChange(filter: EventFilter): void {
    this.activeFilter = { ...this.activeFilter, ...filter };
    this.currentPage = 1;
    this.loadEvents();
  }

  onSportsFilterChange(key: string, event: any): void {
    const value = (event.target as HTMLSelectElement).value;

    // Create a copy of the current filter
    const currentFilter = { ...this.activeFilter };

    if (value && value !== 'All') {
      // Set the new value (e.g., team: 'Al Masry')
      (currentFilter as any)[key] = value;
    } else {
      // Remove the key if 'All' is selected
      delete (currentFilter as any)[key];
    }

    // Update the state and reload
    this.activeFilter = currentFilter;
    this.currentPage = 1;
    this.loadEvents();
  }


  loadEvents(): void {
    // Synchronize current local filter to URL
    const queryParams: any = { ...this.route.snapshot.queryParams };

    if (this.activeFilter.category) queryParams.category = this.activeFilter.category;
    if (this.activeFilter.query) queryParams.q = this.activeFilter.query;
    else delete queryParams.q;

    if (this.activeFilter.team) queryParams.team = this.activeFilter.team;
    else delete queryParams.team;

    if (this.activeFilter.stadium) queryParams.stadium = this.activeFilter.stadium;
    else delete queryParams.stadium;

    if (this.activeFilter.championship_type) queryParams.championship_type = this.activeFilter.championship_type;
    else delete queryParams.championship_type;

    if (this.activeFilter.venue) queryParams.venue = this.activeFilter.venue;
    else delete queryParams.venue;

    // Navigate to update URL (this will trigger the queryParams subscription in ngOnInit)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private executeLoadEvents(): void {
    this.loading.set(true);

    const request: EventFilter = {
      ...this.activeFilter,
      page: this.currentPage,
      limit: 12
    };

    // Check if we are in 'entertainment' mode to load Shows instead of Events
    if (this.activeFilter.category && this.activeFilter.category.toLowerCase() === 'entertainment') {


      const showFilter: any = {
        category: 'entertainment',
        search: this.activeFilter.query,
        venue: this.activeFilter.venue,
        sort: this.activeFilter.sort
      };

      this.eventsService.getAllShows(showFilter).subscribe({
        next: (shows: any[]) => {

          setTimeout(() => {
            // Map Show -> Event
            const mappedEvents = shows.map(show => {
              const baseEvent = show.event_id || {};
              return {
                ...baseEvent, // Copy event details (title, poster, etc.) if they exist
                _id: (show.event_id && typeof show.event_id === 'object') ? (show.event_id as any)._id : show._id,

                // Fallback for independent shows
                title: show.title || baseEvent.title || 'Untitled Show',
                description: show.description || baseEvent.description || 'No description available.',
                poster_url: this.formatPosterUrl(show.poster_url) || this.formatPosterUrl(baseEvent.poster_url) || 'assets/placeholder-event.svg',
                is_independent_show: !show.event_id,

                // Mapped Venue Details
                venue_id: show.hall_id?.venue_id ? {
                  _id: show.hall_id.venue_id._id,
                  name: show.hall_id.venue_id.name,
                  location: show.hall_id.venue_id.location
                } : undefined,

                release_date: show.start_time, // Use SHOW time
                min_price: show.price, // Use SHOW price
                category: 'Entertainment'
              } as Event;
            });


            this.events.set(mappedEvents);
            this.totalResults = shows.length;
            this.totalPages = 1;
            this.loading.set(false);
            this.scroller.scrollToPosition([0, 0]);
          }, 300);
        },
        error: (err) => {
          console.error('Error loading shows:', err);
          this.loading.set(false);
          this.events.set([]);
        }
      });
      return;
    }

    this.eventsService.getEvents(request).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.events.set(response.data);
          this.totalResults = response.meta.total;
          this.totalPages = response.meta.pages;

          // Options extracted once in loadAllSportsOptions

          this.loading.set(false);
          this.scroller.scrollToPosition([0, 0]);
        }, 300);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.loading.set(false);
        this.events.set([]);
      }
    });
  }

  private extractSportsFilterOptions(events: Event[]): void {
    const uniqueTeams = new Set<string>();
    const uniqueStadiums = new Set<string>();
    const uniqueTournaments = new Set<string>();

    events.forEach(event => {
      if (event.home_team) uniqueTeams.add(event.home_team);
      if (event.away_team) uniqueTeams.add(event.away_team);
      if (event.stadium_id) {
        // If stadium_id is populated object, use name, else ID
        const name = typeof event.stadium_id === 'object' ? event.stadium_id.name : event.stadium_id;
        if (name) uniqueStadiums.add(name);
      }
      if (event.championship_type) uniqueTournaments.add(event.championship_type);
    });

    if (events.length > 0) {
      this.teams.set(Array.from(uniqueTeams).sort());
      this.stadiums.set(Array.from(uniqueStadiums).sort());
      this.tournamentTypes.set(Array.from(uniqueTournaments).sort());
    } else if (this.teams().length === 0) {
      // Only keep it empty if we never had options (e.g., first load failed)
      // If we already had options and a specific filter returned 0, we keep the previous options so user can un-filter.
      this.teams.set([]);
      this.stadiums.set([]);
      this.tournamentTypes.set([]);
    }
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadEvents(); // Don't verify URL updates strictly for internal logic if we want to stay on same route base
  }

  resetFilters(): void {
    this.activeFilter = { category: this.activeFilter.category };
    this.currentPage = 1;
    this.loadEvents();
  }

  removeTag(tag: string): void {
    const teamLabel = this.langService.translate('events.tag.team');
    const stadiumLabel = this.langService.translate('events.tag.stadium');
    const tournamentLabel = this.langService.translate('events.tag.tournament');
    const searchLabel = this.langService.translate('events.tag.search');
    const venueLabel = this.langService.translate('events.tag.venue');

    if (tag.startsWith(teamLabel)) delete this.activeFilter.team;
    if (tag.startsWith(stadiumLabel)) delete this.activeFilter.stadium;
    if (tag.startsWith(tournamentLabel)) delete this.activeFilter.championship_type;
    if (tag.startsWith(searchLabel)) delete this.activeFilter.query;
    if (tag === venueLabel) delete this.activeFilter.venue;

    this.currentPage = 1;
    this.loadEvents();
  }

  private formatPosterUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('uploads/') ? url.replace('uploads/', '') : url;
    return `${environment.uploadsUrl}/${cleanPath.replace(/\\/g, '/')}`;
  }
}