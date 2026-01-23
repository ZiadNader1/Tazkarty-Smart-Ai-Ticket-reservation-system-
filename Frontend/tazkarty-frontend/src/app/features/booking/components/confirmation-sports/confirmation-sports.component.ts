import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { LanguageService } from '../../../../core/services/language.service';
import { Booking } from '../../../../models/booking.model';

@Component({
  selector: 'app-confirmation-sports',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent],
  templateUrl: './confirmation-sports.html',
  styles: [`
    .confetti-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      background: linear-gradient(45deg, #10b981, #3b82f6, #f59e0b, #ef4444);
      top: -10px;
      animation: confetti-fall 3s linear infinite;
    }
    @keyframes confetti-fall {
      to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
  `]
})
export class ConfirmationSportsComponent {
  @Input() booking: Booking | null = null;
  @Input() ticketId: string = '';

  constructor(public langService: LanguageService) { }

  downloadTicket(): void {
    alert(this.langService.translate('booking.download_ticket'));
  }

  shareTicket(): void {
    if (navigator.share) {
      navigator.share({
        title: this.langService.translate('booking.share_ticket_title'),
        text: this.langService.translate('booking.share_ticket_text'),
        url: window.location.href
      });
    } else {
      alert(this.langService.translate('booking.share_ticket_success'));
    }
  }

  addToCalendar(): void {
    alert(this.langService.translate('booking.add_calendar'));
  }

  getEventTitle(): string {
    const b = this.booking;
    if (!b) return this.langService.translate('booking.match_day');
    if (typeof b.show_id === 'object') {
      const show = b.show_id as any;
      if (show.title && show.title !== 'Event') return this.langService.translate(show.title);
      if (show.event_id && show.event_id.title) return this.langService.translate(show.event_id.title);
    }
    return this.langService.translate('booking.match_day');
  }

  getEventCategory(): string {
    return this.langService.translate('booking.sports_event'); // Detected by parent
  }

  getEventDate(): Date | null {
    const b = this.booking;
    if (b && typeof b.show_id === 'object') {
      return (b.show_id as any).start_time;
    }
    return null;
  }

  getStadiumName(): string {
    const b = this.booking;
    if (!b || typeof b.show_id !== 'object') return '';
    const show = b.show_id as any;

    // Try Show -> Hall -> Stadium
    if (show.hall_id && typeof show.hall_id === 'object') {
      if (show.hall_id.stadium_id && typeof show.hall_id.stadium_id === 'object') return show.hall_id.stadium_id.name;
    }

    // Try Show -> Event -> Stadium
    if (show.event_id && typeof show.event_id === 'object') {
      if (show.event_id.stadium_id && typeof show.event_id.stadium_id === 'object') return this.langService.translate(show.event_id.stadium_id.name);
    }

    return this.langService.translate('common.stadium');
  }

  getLocation(): string {
    const b = this.booking;
    if (!b || typeof b.show_id !== 'object') return '';
    const show = b.show_id as any;

    if (show.hall_id && typeof show.hall_id === 'object') {
      if (show.hall_id.stadium_id && typeof show.hall_id.stadium_id === 'object') return show.hall_id.stadium_id.location || show.hall_id.stadium_id.city || '';
    }

    if (show.event_id && typeof show.event_id === 'object') {
      if (show.event_id.stadium_id && typeof show.event_id.stadium_id === 'object') return show.event_id.stadium_id.location || '';
    }
    return '';
  }

  getSectionName(): string {
    const b = this.booking;
    if (b && b.seats && b.seats.length > 0) {
      const seat = b.seats[0] as any;
      if (seat.section_id) {
        if (typeof seat.section_id === 'object' && seat.section_id.name) {
          return this.langService.translate(seat.section_id.name);
        }
      }
    }
    return this.langService.translate('common.general');
  }
}
