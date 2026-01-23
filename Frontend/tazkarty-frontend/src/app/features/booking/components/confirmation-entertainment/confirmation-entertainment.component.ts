import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { LanguageService } from '../../../../core/services/language.service';
import { Booking } from '../../../../models/booking.model';

@Component({
    selector: 'app-confirmation-entertainment',
    standalone: true,
    imports: [CommonModule, RouterModule, QRCodeComponent],
    templateUrl: './confirmation-entertainment.html',
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
      background: linear-gradient(45deg, #f59e0b, #ef4444, #10b981, #3b82f6, #8b5cf6);
      top: -10px;
      animation: confetti-fall 3s linear infinite;
    }
    @keyframes confetti-fall {
      to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
  `]
})
export class ConfirmationEntertainmentComponent {
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
        const b = this.booking as any;
        if (!b) return this.langService.translate('common.booking');
        if (b.isTrain) return `${this.langService.translate('nav.trains')} #${b.train_number}`;
        if (typeof b.show_id === 'object') {
            const show = b.show_id as any;
            if (show.title && show.title !== 'Event') return this.langService.translate(show.title);
            if (show.event_id && show.event_id.title) return this.langService.translate(show.event_id.title);
        }
        return this.langService.translate('common.booking');
    }

    getEventCategory(): string {
        const b = this.booking as any;
        if (!b) return this.langService.translate('common.booking');
        if (b.isTrain) return this.langService.translate(b.train_type || 'nav.trains');
        if (b && typeof b.show_id === 'object') {
            const show = b.show_id as any;
            if (show.event_id?.category) return this.langService.translate(show.event_id.category);
            if (show.event_id?.type) return this.langService.translate(show.event_id.type);
        }
        return this.langService.translate('booking.entertainment_show');
    }

    getEventDate(): Date | null {
        const b = this.booking as any;
        if (!b) return null;
        if (b.isTrain) return b.travel_date;
        if (b && typeof b.show_id === 'object') {
            return (b.show_id as any).start_time;
        }
        return null;
    }

    getVenueName(): string {
        const b = this.booking as any;
        if (!b) return '';
        if (b.isTrain) return `${this.langService.translate(b.departure_city)} → ${this.langService.translate(b.destination_city)}`;
        if (typeof b.show_id !== 'object') return '';
        const show = b.show_id as any;
        if (show.hall_id && typeof show.hall_id === 'object') {
            const hall = show.hall_id;
            if (hall.venue_id && typeof hall.venue_id === 'object') return this.langService.translate(hall.venue_id.name);
        }
        if (show.event_id && typeof show.event_id === 'object') {
            if (show.event_id.venue_id && typeof show.event_id.venue_id === 'object') return this.langService.translate(show.event_id.venue_id.name);
        }
        return '';
    }

    getVenueLocation(): string {
        const b = this.booking as any;
        if (!b) return '';
        if (b.isTrain) return b.departure_time || '';
        if (typeof b.show_id !== 'object') return '';
        const show = b.show_id as any;
        if (show.hall_id && typeof show.hall_id === 'object') {
            const hall = show.hall_id;
            if (hall.venue_id && typeof hall.venue_id === 'object') return hall.venue_id.city || '';
        }
        if (show.event_id && typeof show.event_id === 'object') {
            if (show.event_id.venue_id && typeof show.event_id.venue_id === 'object') return show.event_id.venue_id.city || '';
        }
        return '';
    }

    getSeatLabels(): string[] {
        const b = this.booking as any;
        if (!b || !b.seats) return [];
        if (b.isTrain) {
            return b.seats.map((s: any) => `C${s.carriage_number}-${s.seat_label}`);
        }
        if (b.seats.length > 0 && typeof b.seats[0] === 'object') {
            return b.seats.map((s: any) => {
                if (s.row_label && s.seat_label) return `${s.row_label}${s.seat_label}`;
                if (s.row && s.seat_label) return `${this.langService.translate('common.row')} ${s.row} - ${s.seat_label}`;
                if (s.label) return this.langService.translate(s.label);
                if (s.row && s.number) return `${s.row}-${s.number}`;
                return this.langService.translate('trains.seat');
            });
        }
        return [];
    }
}
