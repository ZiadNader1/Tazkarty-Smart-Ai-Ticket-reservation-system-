

export interface Event {
  _id: string;
  title: string;
  description: string;
  category_id: string | EventCategory;
  venue_id: string | Venue;
  type: 'movie' | 'concert' | 'sports' | 'show';
  duration_minutes: number;
  poster_url: string;
  banner_url?: string; // Larger image for details page
  release_date: Date;
  is_active: boolean;
  layout_image?: string; // Optional override for stadium layout
  is_independent_show?: boolean; // UI Flag
  is_featured?: boolean;

  // Marketing & Pricing (Calculated/Aggregated)
  min_price?: number;
  max_price?: number;
  rating?: number;
  review_count?: number;
  tags?: string[]; // e.g., 'Trending', 'Selling Fast'
  shows_count?: number;
  is_sold_out?: boolean;

  // Sports Oriented Fields
  stadium_id?: string | any;
  championship_type?: 'League' | 'Cup' | 'Generic';
  home_team?: string;
  away_team?: string;
  total_capacity?: number;
  home_capacity?: number;
  away_capacity?: number;
  group?: string; // e.g. "Group A"
  stage?: string; // e.g. "Semi-Final", "Week 12"

  // AI Integration
  ai_score?: number; // 0-100
  ai_explanation?: string; // "Recommended because you like Action movies"

  createdAt: Date;
  updatedAt: Date;
}

export interface EventCategory {
  _id: string;
  name: string;
  description?: string;
  slug?: string;
}

export interface Venue {
  _id: string;
  name: string;
  location: string; // Address or City
  map_url?: string;
  capacity?: number;
  image?: string;
  description?: string;
  amenities?: string[];
  is_active: boolean;
}

export interface EventFilter {
  query?: string;
  category?: string;
  venue?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sort?: 'date' | 'price_asc' | 'price_desc' | 'rating';
  is_active?: boolean;
  is_featured?: boolean;

  // Sports Filters
  team?: string;
  stadium?: string;
  championship_type?: string;
  group?: string;
  stage?: string;
}

export interface EventsResponse {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
