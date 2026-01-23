import { SeatMapConfig, SeatDefinition } from '../../../core/models/seat-map.types';

export interface RenderOptions {
    showLabels: boolean;
    showSectionLabels: boolean;
    colorScheme: {
        background: string;
        seatStandard: string;
        seatVip: string;
        seatUnavailable: string;
        seatSelected: string;
        text: string;
    };
    scale: number; // Viewport zoom level
    offsetX: number; // Viewport pan X
    offsetY: number; // Viewport pan Y
    tierColors?: Record<string, string>; // Map 'standard' -> '#ccc'
}

export interface InteractionEvent {
    type: 'click' | 'hover' | 'background';
    seat?: SeatDefinition;
    sectionId?: string;
    point: { x: number; y: number }; // Global coordinates
    shiftKey?: boolean;
    originalEvent?: MouseEvent | TouchEvent; // DOM Event
}

export interface SeatRenderer {
    /**
     * Renders the given configuration to the target (Canvas/SVG)
     */
    render(config: SeatMapConfig, runtimeStatus?: Map<string, string>): void;

    /**
     * Clean up resources (event listeners etc)
     */
    destroy(): void;

    /**
     * Converts DOM event coordinates to Logical coordinates
     */
    resolveClick(x: number, y: number): InteractionEvent | null;

    /**
     * Updates viewport transform
     */
    setTransform(scale: number, offsetX: number, offsetY: number): void;
}
