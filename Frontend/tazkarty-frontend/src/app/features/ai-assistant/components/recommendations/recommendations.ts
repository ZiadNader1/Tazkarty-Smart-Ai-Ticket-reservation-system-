import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiService } from '../../services/ai';

interface RecommendedEventViewModel {
  id: string;
  title: string;
  category: 'Movie' | 'Concert' | 'Sports' | 'Show' | string;
  venue: string;
  date: string;
  time: string;
  rating: number;
  tags: string[];
  image?: string;
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendations.html',
  styleUrls: ['./recommendations.scss'],
})
export class RecommendationsComponent implements OnInit {
  private readonly LIMIT = 8;

  loading = signal(false);
  error = signal<string | null>(null);
  recommended = signal<RecommendedEventViewModel[]>([]);

  constructor(private aiService: AiService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.loading.set(true);
    this.error.set(null);

    // 1) حاول تجيب الريكومينديشنز المخزنة من سلوك اليوزر
    this.aiService.getUserRecommendations().subscribe({
      next: (res) => {
        this.mapAndSetRecommendations(res.recommendations || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        const message = err?.message || '';

        // لو مفيش ريكومينديشنز محفوظة، نولّد جديدة من السلوك
        if (message.toLowerCase().includes('no recommendations')) {
          this.fetchGeneratedRecommendations();
        } else {
          console.error('Recommendations error:', err);
          this.error.set('Failed to load your recommendations. Please try again later.');
          this.loading.set(false);
        }
      }
    });
  }

  private fetchGeneratedRecommendations(): void {
    this.aiService.generateRecommendations(this.LIMIT).subscribe({
      next: (res) => {
        this.mapAndSetRecommendations(res.recommendations || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Generate recommendations error:', err);
        this.error.set('Could not generate recommendations right now. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  private mapAndSetRecommendations(items: any[]): void {
    const mapped: RecommendedEventViewModel[] = items.map((r: any) => {
      const ev = r.event || r.item || {};
      const rawScore = typeof r.score === 'number' ? r.score : 0;
      const rating = Math.round(rawScore * 5 * 10) / 10 || 4.5;

      return {
        id: String(ev._id || r.id),
        title: ev.title || 'Recommended Event',
        category: ev.type === 'movie' ? 'Movie'
                : ev.type === 'concert' ? 'Concert'
                : ev.type === 'sports' ? 'Sports'
                : ev.type === 'show' ? 'Show'
                : (ev.type || 'Event'),
        venue: (ev.venue_id && (ev.venue_id.name || ev.venue_id)) || 'Popular venue',
        date: 'Soon',
        time: 'Evening',
        rating,
        tags: [
          ev.type || 'Event',
          ...(ev.category_id && ev.category_id.name ? [ev.category_id.name] : [])
        ]
      };
    });

    this.recommended.set(mapped);
  }

  getCategoryIcon(category: RecommendedEventViewModel['category']): string {
    const c = (category || '').toString().toLowerCase();
    if (c.includes('movie')) return '🎬';
    if (c.includes('concert')) return '🎵';
    if (c.includes('sport')) return '⚽';
    if (c.includes('show') || c.includes('theater')) return '🎭';
    return '🎟️';
  }
}
