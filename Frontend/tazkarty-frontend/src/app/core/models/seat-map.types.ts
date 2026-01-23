
export interface Point {
    x: number;
    y: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

export interface SeatDefinition {
    id: string;          // Immutable UUID (e.g., "550e8400-e29b...")
    label: string;       // human readable "1", "101" -- can be edited
    x: number;           // Logical coordinates relative to Row/Section
    y: number;
    type: string;        // "standard", "vip", "wheelchair"
    status?: 'available' | 'disabled' | 'gap'; // 'gap' means space/aisle
}

export interface Row {
    id: string; // UUID
    label: string; // "A", "Row 1"
    seats: SeatDefinition[];
    position: Point; // Relative to Section center/anchor
    // Curved Row Parameters
    radius: number;
    startAngle: number; // Degrees
    endAngle: number;   // Degrees
    seatCount: number;
    // Layout
    rowType?: 'curved' | 'linear'; // default 'curved'
    spacing?: number; // Distance between seats if linear (or arc length?)
}

export interface Stage {
    label: string;
    position: Point;
    dimensions: Dimensions;
    rotation?: number;
    type?: 'rectangle' | 'arc';
}

export interface Section {
    id: string; // UUID
    label: string; // "Stalls", "Balcony"
    rows: Row[];
    position: Point; // Relative to Map
    dimensions: Dimensions; // Derived or explicit bounds
    rotation?: number; // Rotation in degrees
    type?: 'assigned' | 'ga'; // Default 'assigned'
    capacity?: number; // For GA sections
    rating?: number; // Quality of view rating ?
    color?: string; // Hex color for GA/Zone background
}

export interface Zone {
    id: string; // UUID
    label: string;
    position: Point;
    dimensions: Dimensions;
    rotation?: number;
    color: string;
}

export interface SeatMapConfig {
    version: number;     // Monotonic versioning for cache busting/validating against tickets
    zones?: Zone[];      // Independent colored areas
    sections: Section[];
    width: number;       // Global canvas width
    height: number;      // Global canvas height
    backgroundImage?: string;
    stage?: Stage;
}

// Runtime Types (Checking availability)
export interface SeatStatus {
    seat_id: string;
    status: 'available' | 'locked' | 'booked' | 'sold' | 'unavailable';
    price_tier?: string;
}
