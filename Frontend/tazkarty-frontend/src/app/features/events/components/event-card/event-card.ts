import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Event } from '../../../../models/event.model';
import { LanguageService } from '../../../../core/services/language.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-card.html',
  styles: [`
    :host { display: block; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class EventCard {
  constructor(public langService: LanguageService) { }
  @Input({ required: true }) event!: Event;

  get isSoldOut(): boolean {
    return this.event.is_sold_out || false;
  }

  get minPrice(): number {
    return this.event.min_price || 0;
  }

  get categoryName(): string {
    let name = 'common.general';
    if (this.event.category_id && typeof this.event.category_id === 'object' && 'name' in this.event.category_id) {
      name = (this.event.category_id as any).name;
    }
    return this.langService.translate(name);
  }

  get venueName(): string {
    let name = 'TBA';
    if (this.event.venue_id && typeof this.event.venue_id === 'object') {
      name = (this.event.venue_id as any).name;
    } else if (this.event.stadium_id && typeof this.event.stadium_id === 'object') {
      name = (this.event.stadium_id as any).name;
    }
    return this.langService.translate(name);
  }

  get isSportsEvent(): boolean {
    const rawCategory = this.event.category_id && typeof this.event.category_id === 'object' && 'name' in this.event.category_id ? (this.event.category_id as any).name : '';
    return rawCategory.toLowerCase().includes('sports') || !!this.event.home_team;
  }

  getPosterUrl(): string {
    const url = this.event.poster_url;
    if (!url) return 'assets/placeholder-event.svg';
    if (url.startsWith('http')) return url;

    // Fix paths like uploads/image.png
    const cleanPath = url.startsWith('uploads/') ? url.replace('uploads/', '') : url;
    return `${environment.uploadsUrl}/${cleanPath.replace(/\\/g, '/')}`;
  }
}
