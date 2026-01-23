import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Event, EventFilter, EventsResponse } from '../../models/event.model';
import { Show } from '../../models/show.model';

@Injectable({
    providedIn: 'root'
})
export class EventsService {

    constructor(private api: ApiService) { }

    /**
     * Get single show details by ID
     */
    getShowById(showId: string): Observable<Show> {
        return this.api.get<Show>(`shows/${showId}`);
    }

    /**
     * Get filtered list of events with pagination
     */
    getEvents(filter: EventFilter): Observable<EventsResponse> {
        // Convert filter object to query params
        const params: any = {};
        if (filter.query) params.search = filter.query;
        if (filter.category) params.category = filter.category;
        if (filter.venue) params.venue = filter.venue;
        if (filter.minPrice) params.min_price = filter.minPrice;
        if (filter.maxPrice) params.max_price = filter.maxPrice;
        if (filter.dateFrom) params.date_from = filter.dateFrom.toISOString();
        if (filter.dateTo) params.date_to = filter.dateTo.toISOString();
        if (filter.sort) params.sort = filter.sort;
        if (filter.is_active !== undefined) params.is_active = filter.is_active;

        // Sports Filters
        if (filter.team) params.team = filter.team;
        if (filter.stadium) params.stadium = filter.stadium;
        if (filter.championship_type) params.championship_type = filter.championship_type;

        params.page = filter.page || 1;
        params.limit = filter.limit || 12;

        // Cache Busting
        params._t = Date.now();


        return this.api.get<EventsResponse>('events', params);
    }

    /**
     * Get single event details
     */
    getEventById(id: string): Observable<Event> {
        return this.api.get<Event>(`events/${id}`);
    }

    /**
     * Get relevant shows for an event
     */
    getEventShows(eventId: string): Observable<Show[]> {
        return this.api.get<Show[]>(`shows/event/${eventId}`);
    }

    /**
     * Admin: Create new event
     */
    createEvent(eventData: Partial<Event>): Observable<Event> {
        return this.api.post<Event>('events', eventData);
    }

    /**
     * Admin: Create new show for an event
     */
    /**
     * Admin: Create new show for an event
     */
    createShow(eventId: string | null | undefined, showData: FormData | any): Observable<Show> {
        // If FormData, append event_id if needed
        if (showData instanceof FormData) {
            if (eventId) showData.append('event_id', eventId);
            return this.api.post<Show>(`shows`, showData);
        }

        const payload = { ...showData };
        if (eventId) {
            payload.event_id = eventId;
        }
        return this.api.post<Show>(`shows`, payload);
    }

    /**
     * Admin: Update existing show
     */
    updateShow(showId: string, showData: FormData | any): Observable<Show> {
        return this.api.put<Show>(`shows/${showId}`, showData);
    }

    /**
     * Admin: Delete show
     */
    deleteShow(showId: string): Observable<any> {
        return this.api.delete(`shows/${showId}`);
    }

    /**
     * Get ALL shows (with optional filtering)
     */
    getAllShows(filter: any = {}): Observable<Show[]> {
        return this.api.get<Show[]>('shows', filter);
    }

    /**
     * Get all categories for filtering
     */
    getCategories(): Observable<any[]> {
        return this.api.get('event-categories');
    }

    /**
     * Get all venues for filtering
     */
    getVenues(): Observable<any[]> {

        return this.api.get<any>('venues').pipe(
            map(res => {

                return res.venues || [];
            })
        );
    }

    /**
     * Get halls for a specific venue
     */
    getVenueHalls(venueId: string): Observable<any[]> {
        return this.api.get(`halls/venue/${venueId}`);
    }

    /**
     * Get halls for a specific stadium
     */
    getStadiumHalls(stadiumId: string): Observable<any[]> {
        return this.api.get(`halls/stadium/${stadiumId}`);
    }

    /**
     * Get single hall by ID (for seat map editing)
     */
    getHallById(id: string): Observable<any> {
        return this.api.get(`halls/${id}`);
    }

    /**
     * Update hall details (including seat map config)
     */
    updateHall(id: string, data: any): Observable<any> {
        return this.api.put(`halls/${id}`, data);
    }
}
