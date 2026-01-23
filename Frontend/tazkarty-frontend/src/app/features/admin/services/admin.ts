import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SeatMapConfig } from '../../../core/models/seat-map.types';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Content-Type is left undefined so browser sets it with boundary
    });
  }

  // ========== AUTHENTICATION ==========
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admins/login`, { email, password });
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admins/register`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admins/profile`, {
      headers: this.getHeaders()
    });
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admins/update`, data, {
      headers: this.getHeaders()
    });
  }

  // ========== DASHBOARD STATS ==========
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getRecentBookings(limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/bookings/recent?limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  // ========== VENUE MANAGEMENT ==========
  getVenues(params?: any): Observable<any> {

    return this.http.get(`${this.apiUrl}/venues`, {
      headers: this.getHeaders(),
      params
    });
  }

  getVenueById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/venues/${id}`, {
      headers: this.getHeaders()
    });
  }

  createVenue(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/venues`, data, {
      headers: this.getHeaders()
    });
  }

  updateVenue(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/venues/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteVenue(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/venues/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== STADIUM MANAGEMENT ==========
  getStadiums(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/stadiums`, {
      headers: this.getHeaders(),
      params
    });
  }

  getStadiumById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stadiums/${id}`, {
      headers: this.getHeaders()
    });
  }

  createStadium(data: any): Observable<any> {
    const headers = data instanceof FormData ? this.getMultipartHeaders() : this.getHeaders();
    return this.http.post(`${this.apiUrl}/stadiums`, data, { headers });
  }

  updateStadium(id: string, data: any): Observable<any> {
    const headers = data instanceof FormData ? this.getMultipartHeaders() : this.getHeaders();
    return this.http.put(`${this.apiUrl}/stadiums/${id}`, data, { headers });
  }

  deleteStadium(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stadiums/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== HALL MANAGEMENT ==========
  getHallsByVenue(venueId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/halls/venue/${venueId}`, {
      headers: this.getHeaders()
    });
  }

  getHallById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/halls/${id}`, {
      headers: this.getHeaders()
    });
  }

  createHall(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/halls`, data, {
      headers: this.getHeaders()
    });
  }

  updateHall(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/halls/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  updateHallSeatConfig(id: string, config: SeatMapConfig): Observable<any> {
    return this.http.put(`${this.apiUrl}/halls/${id}/seat-config`, { seat_map_config: config }, {
      headers: this.getHeaders()
    });
  }

  deleteHall(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/halls/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== EVENT MANAGEMENT ==========
  getEvents(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/events`, {
      headers: this.getHeaders(),
      params
    });
  }

  getEventById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/${id}`, {
      headers: this.getHeaders()
    });
  }

  createEvent(data: any): Observable<any> {
    const headers = data instanceof FormData ? this.getMultipartHeaders() : this.getHeaders();
    return this.http.post(`${this.apiUrl}/events`, data, { headers });
  }

  updateEvent(id: string, data: any): Observable<any> {
    const headers = data instanceof FormData ? this.getMultipartHeaders() : this.getHeaders();
    return this.http.put(`${this.apiUrl}/events/${id}`, data, { headers });
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== EVENT CATEGORIES ==========
  getEventCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/event-categories`, {
      headers: this.getHeaders()
    });
  }

  createEventCategory(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/event-categories`, data, {
      headers: this.getHeaders()
    });
  }

  updateEventCategory(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/event-categories/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteEventCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/event-categories/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== SHOW MANAGEMENT ==========
  getShows(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/shows`, {
      headers: this.getHeaders(),
      params
    });
  }

  getShowById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/shows/${id}`, {
      headers: this.getHeaders()
    });
  }

  getShowsByEvent(eventId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/shows/event/${eventId}`, {
      headers: this.getHeaders()
    });
  }

  getShowsByVenue(venueId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/shows/venue/${venueId}`, {
      headers: this.getHeaders()
    });
  }

  createShow(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/shows`, data, {
      headers: this.getHeaders()
    });
  }

  updateShow(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/shows/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteShow(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/shows/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== SEAT MANAGEMENT ==========
  generateSeats(showId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/seats/generate`, { showId }, {
      headers: this.getHeaders()
    });
  }

  getSeatsByShow(showId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/seats/show/${showId}`, {
      headers: this.getHeaders()
    });
  }

  // ========== USER MANAGEMENT ==========
  getUsers(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== PROMO CODE MANAGEMENT ==========
  getPromoCodes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/promocodes`, {
      headers: this.getHeaders()
    });
  }

  getPromoCodeById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/promocodes/${id}`, {
      headers: this.getHeaders()
    });
  }

  createPromoCode(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/promocodes`, data, {
      headers: this.getHeaders()
    });
  }

  updatePromoCode(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/promocodes/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deletePromoCode(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/promocodes/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== PAYMENTS ==========
  getAllPayments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments`, {
      headers: this.getHeaders()
    });
  }

  // ========== ANALYTICS ==========
  getBookingStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/bookings`, {
      headers: this.getHeaders()
    });
  }

  getRevenueStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/revenue`, {
      headers: this.getHeaders()
    });
  }
}