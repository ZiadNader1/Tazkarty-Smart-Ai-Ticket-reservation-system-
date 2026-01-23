// =====================================================
// FILE: src/app/features/home/home.ts
// Home Page Component
// =====================================================

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventsService } from '../../core/services/events.service';
import { Event } from '../../models/event.model';
import { LanguageService } from '../../core/services/language.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  searchQuery = '';
  loading = signal(false);
  featuredEvents = signal<Event[]>([]);
  upcomingEvents = signal<Event[]>([]);

  // Carousel Logic
  activeSlideIndex = signal(0);
  private carouselInterval: any;

  quickCategories = computed(() => [
    { name: this.langService.translate('nav.sports'), type: 'sports' },
    { name: this.langService.translate('nav.entertainment'), type: 'entertainment' },
    { name: this.langService.translate('nav.trains'), type: 'trains' }
  ]);

  constructor(
    private eventService: EventsService,
    private router: Router,
    public langService: LanguageService
  ) { }


  ngOnInit(): void {
    this.loadFeaturedEvents();
    this.loadUpcomingEvents();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  loadFeaturedEvents(): void {
    this.loading.set(true);
    // Fetch specifically featured events
    this.eventService.getEvents({ is_active: true, is_featured: true } as any)
      .subscribe({
        next: (response) => {
          this.featuredEvents.set(response.data);
          this.loading.set(false);
          this.activeSlideIndex.set(0);
        },
        error: (err) => {
          console.error('Error loading events:', err);
          this.loading.set(false);
        }
      });
  }

  loadUpcomingEvents(): void {
    this.eventService.getEvents({ is_active: true } as any)
      .subscribe({
        next: (response) => {
          // Show non-featured events or just the latest
          this.upcomingEvents.set(response.data.slice(0, 8));
        },
        error: (err) => console.error('Error loading upcoming events:', err)
      });
  }

  // Carousel Methods
  startCarousel(): void {
    this.stopCarousel();
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  nextSlide(): void {
    const count = this.featuredEvents().length;
    if (count > 0) {
      this.activeSlideIndex.update(i => (i + 1) % count);
    }
  }

  prevSlide(): void {
    const count = this.featuredEvents().length;
    if (count > 0) {
      this.activeSlideIndex.update(i => (i - 1 + count) % count);
    }
  }

  goToSlide(index: number): void {
    this.activeSlideIndex.set(index);
    this.startCarousel(); // Reset timer
  }

  search(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/events'], {
        queryParams: {
          q: this.searchQuery,
          category: 'sports' // Default to sports view for global search
        }
      });
    }
  }

  filterByCategory(type: string): void {
    if (type === 'trains') {
      this.router.navigate(['/trains']);
      return;
    }
    this.router.navigate(['/events'], {
      queryParams: { category: type }
    });
  }

  goToEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  getVenueName(event: Event): string {
    if (event.stadium_id) {
      if (typeof event.stadium_id === 'object' && event.stadium_id !== null) {
        return event.stadium_id.name || 'Stadium';
      }
      return 'Stadium';
    }
    if (typeof event.venue_id === 'object' && event.venue_id !== null) {
      return event.venue_id.name || 'Venue';
    }
    return 'Venue';
  }

  getVenueLabel(event: Event): string {
    return event.type === 'sports' ? 'common.stadium' : 'common.venue';
  }
}