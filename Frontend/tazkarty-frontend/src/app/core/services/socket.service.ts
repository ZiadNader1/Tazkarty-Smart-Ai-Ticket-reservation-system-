import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SocketNotification } from '../../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  // Subjects for different event types
  private notificationSubject = new Subject<SocketNotification>();
  private paymentUpdateSubject = new Subject<any>();
  private ticketUpdateSubject = new Subject<any>();

  // Public observables
  public notifications$ = this.notificationSubject.asObservable();
  public paymentUpdates$ = this.paymentUpdateSubject.asObservable();
  public ticketUpdates$ = this.ticketUpdateSubject.asObservable();

  constructor(private authService: AuthService) { }

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.connected || this.socket) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('No auth token, cannot connect to socket');
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {

      this.connected = true;
    });

    this.socket.on('disconnect', () => {

      this.connected = false;
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Application events
    this.socket.on('notification', (data: SocketNotification) => {

      this.notificationSubject.next(data);
    });

    this.socket.on('payment:update', (data: any) => {

      this.paymentUpdateSubject.next(data);
    });

    this.socket.on('ticket:update', (data: any) => {

      this.ticketUpdateSubject.next(data);
    });

    this.socket.on('notification:broadcast', (data: any) => {

      this.notificationSubject.next(data);
    });

    // Pong response (for ping)
    this.socket.on('pong', (data: any) => {

    });
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Send ping to server
   */
  ping(): void {
    if (this.socket && this.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Emit custom event
   */
  emit(event: string, data: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Listen to custom event
   */
  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }

      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      // Cleanup
      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }
}