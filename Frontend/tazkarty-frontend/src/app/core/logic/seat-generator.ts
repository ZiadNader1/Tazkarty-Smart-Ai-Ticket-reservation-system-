import { Row, SeatDefinition, Point } from '../models/seat-map.types';

export class SeatGenerator {
    /**
     * Generates seats for a curved row.
     * @param row The row configuration containing radius, angles, and count.
     * @param centerPoint The center point of the arc (relative to the section).
     */
    static generateSeatsFromRow(row: Row, centerPoint: Point = { x: 0, y: 0 }): SeatDefinition[] {
        const seats: SeatDefinition[] = [];
        const { startAngle, endAngle, seatCount, radius } = row;

        if (seatCount <= 0) return [];

        // Linear Layout
        if (row.rowType === 'linear') {
            const spacing = row.spacing || 35;
            // Center the line around (0,0) - which is relative to row.position
            const totalWidth = (seatCount - 1) * spacing;
            const startX = -totalWidth / 2;

            for (let i = 0; i < seatCount; i++) {
                const seatLabel = `${row.label}${i + 1}`;
                seats.push({
                    id: crypto.randomUUID(),
                    label: seatLabel,
                    x: Math.round(startX + (i * spacing)),
                    y: 0,
                    type: 'standard',
                    status: 'available'
                });
            }
            return seats;
        }

        // Curved Layout (Default)
        // Calculate step. If only 1 seat, place it in the middle or at start?
        // Standard convention: if 1 seat, put at (start+end)/2 ?? Or just start.
        // Let's assume evenly distributed inclusive of start and end.
        let step = 0;
        if (seatCount > 1) {
            step = (endAngle - startAngle) / (seatCount - 1);
        }

        for (let i = 0; i < seatCount; i++) {
            const angleDeg = startAngle + (i * step);
            const angleRad = (angleDeg * Math.PI) / 180;

            // Parametric circle equation
            // x = cx + r * cos(a)
            // y = cy + r * sin(a)
            const x = centerPoint.x + radius * Math.cos(angleRad);
            const y = centerPoint.y + radius * Math.sin(angleRad);

            // Create Seat Definition
            // We'll generate a temporary ID if one doesn't exist, but usually this updates existing seats or creates new ones.
            // If we are regenerating, we might want to preserve IDs if we had a mapping, but for simplicity here we generate new/update.
            // *CRITICAL*: In a real app, you'd match existing seats by index to preserve IDs.
            // For this pure function, we'll assume we are creating fresh or the caller handles ID preservation.
            const seatLabel = `${row.label}${i + 1}`;

            seats.push({
                id: crypto.randomUUID(), // New ID for now. Caller should reconcile if needed.
                label: seatLabel,
                x: Math.round(x), // Round to int for cleaner rendering
                y: Math.round(y),
                type: 'standard', // default
                status: 'available'
            });
        }

        return seats;
    }

    /**
     * Helper to reconcile existing seats with new generation (preserve IDs/Types if count matches)
     */
    static updateRowSeats(row: Row): SeatDefinition[] {
        const newSeats = this.generateSeatsFromRow(row, { x: 0, y: 0 }); // Row position is usually handling the offset, or Section does.
        // The Row.position usually acts as the "Center" of the arc for that row? 
        // Or is the Row.position just an offset and the "Center" is relative to that?
        // Let's assume Row.position IS the center of curvature for that row.

        // However, usually rows in a section share a center. 
        // But letting each row have a position = center gives maximum flexibility.

        // We will map new generated coordinates to existing seats if possible.
        const mergedSeats: SeatDefinition[] = [];

        for (let i = 0; i < newSeats.length; i++) {
            const newSeat = newSeats[i];
            if (i < row.seats.length) {
                // Update existing seat
                const existing = row.seats[i];
                mergedSeats.push({
                    ...existing,
                    x: newSeat.x,
                    y: newSeat.y,
                    label: existing.label || newSeat.label // Keep existing label if customized
                });
            } else {
                // Add new seat
                mergedSeats.push(newSeat);
            }
        }

        return mergedSeats;
    }
}
