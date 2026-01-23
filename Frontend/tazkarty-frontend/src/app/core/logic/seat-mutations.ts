import { SeatMapConfig, Section, Row, SeatDefinition, Point } from '../models/seat-map.types';

// Helper for immutability
function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// Simple UUID generator if crypto is not available (fallback)
function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const SeatMutations = {
    /**
     * Creates a new empty configuration
     */
    createEmpty(width = 800, height = 600): SeatMapConfig {
        return {
            version: 1,
            sections: [],
            width,
            height
        };
    },

    addSection(config: SeatMapConfig, section: Omit<Section, 'id' | 'rows'>): SeatMapConfig {
        const newConfig = clone(config);
        const newSection: Section = {
            ...section,
            id: generateId(),
            rows: []
        };
        newConfig.sections.push(newSection);
        newConfig.version++;
        return newConfig;
    },

    addRow(config: SeatMapConfig, sectionId: string, row: Omit<Row, 'id' | 'seats'>): SeatMapConfig {
        const newConfig = clone(config);
        const section = newConfig.sections.find(s => s.id === sectionId);
        if (!section) throw new Error(`Section ${sectionId} not found`);

        const newRow: Row = {
            ...row,
            id: generateId(),
            seats: []
        };
        section.rows.push(newRow);
        newConfig.version++;
        return newConfig;
    },

    addSeat(config: SeatMapConfig, sectionId: string, rowId: string, seat: Omit<SeatDefinition, 'id'>): SeatMapConfig {
        const newConfig = clone(config);
        const section = newConfig.sections.find(s => s.id === sectionId);
        if (!section) throw new Error(`Section ${sectionId} not found`);

        const row = section.rows.find(r => r.id === rowId);
        if (!row) throw new Error(`Row ${rowId} not found`);

        const newSeat: SeatDefinition = {
            ...seat,
            id: generateId()
        };
        row.seats.push(newSeat);
        newConfig.version++;
        return newConfig;
    },

    moveSeat(config: SeatMapConfig, seatId: string, newPosition: Point): SeatMapConfig {
        const newConfig = clone(config);

        for (const section of newConfig.sections) {
            for (const row of section.rows) {
                const seatIndex = row.seats.findIndex(s => s.id === seatId);
                if (seatIndex !== -1) {
                    row.seats[seatIndex].x = newPosition.x;
                    row.seats[seatIndex].y = newPosition.y;
                    newConfig.version++;
                    return newConfig;
                }
            }
        }

        throw new Error(`Seat ${seatId} not found`);
    },

    deleteSeat(config: SeatMapConfig, seatId: string): SeatMapConfig {
        const newConfig = clone(config);
        for (const section of newConfig.sections) {
            for (const row of section.rows) {
                const seatIndex = row.seats.findIndex(s => s.id === seatId);
                if (seatIndex !== -1) {
                    row.seats.splice(seatIndex, 1);
                    newConfig.version++;
                    return newConfig;
                }
            }
        }
        return newConfig; // or throw if strict
    }
};
