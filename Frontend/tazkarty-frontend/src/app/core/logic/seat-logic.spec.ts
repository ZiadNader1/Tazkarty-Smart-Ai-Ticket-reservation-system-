import { describe, it, expect, beforeEach } from 'vitest';
import { SeatMutations } from './seat-mutations';
import { validateNoOverlaps, validateUniqueIds } from './seat-validation';
import { SeatMapConfig } from '../models/seat-map.types';

describe('Seat Map Logic', () => {
    let config: SeatMapConfig;

    beforeEach(() => {
        config = SeatMutations.createEmpty(1000, 1000);
        config = SeatMutations.addSection(config, { label: 'Main Hall', position: { x: 0, y: 0 }, dimensions: { width: 500, height: 500 } });
        // Assuming the ID generated is deterministic or we capture it. 
        // Since we can't easily capture it without return value inspection in the test:
    });

    it('should create a valid empty map', () => {
        const c = SeatMutations.createEmpty();
        expect(c.sections.length).toBe(0);
        expect(c.version).toBe(1);
    });

    it('should add section, row, and seat correctly', () => {
        const c1 = SeatMutations.createEmpty();
        const c2 = SeatMutations.addSection(c1, { label: 'Sec A', position: { x: 0, y: 0 }, dimensions: { width: 100, height: 100 } });
        const secId = c2.sections[0].id;

        const c3 = SeatMutations.addRow(c2, secId, { label: 'Row 1', position: { x: 10, y: 10 } });
        const rowId = c3.sections[0].rows[0].id;

        const c4 = SeatMutations.addSeat(c3, secId, rowId, { label: 'S1', x: 0, y: 0, type: 'standard' });

        expect(c4.sections[0].rows[0].seats.length).toBe(1);
        expect(c4.version).toBe(4); // 1 + 1 + 1 + 1
    });

    it('should detect overlaps', () => {
        let c = SeatMutations.createEmpty();
        c = SeatMutations.addSection(c, { label: 'S', position: { x: 0, y: 0 }, dimensions: { width: 100, height: 100 } });
        const sId = c.sections[0].id;
        c = SeatMutations.addRow(c, sId, { label: 'R', position: { x: 0, y: 0 } });
        const rId = c.sections[0].rows[0].id;

        // Add seat 1 at 0,0
        c = SeatMutations.addSeat(c, sId, rId, { label: '1', x: 0, y: 0, type: 'std' });

        // Add seat 2 at 10,10 (Overlap! Seat size is 30)
        c = SeatMutations.addSeat(c, sId, rId, { label: '2', x: 10, y: 10, type: 'std' });

        const result = validateNoOverlaps(c);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues[0].message).toContain('Overlap');
    });

    it('should validate unique IDs (implicit in mutation, but good to check)', () => {
        let c = SeatMutations.createEmpty();
        c = SeatMutations.addSection(c, { label: 'S', position: { x: 0, y: 0 }, dimensions: { width: 100, height: 100 } });
        // Manually force duplicate ID to test validator
        const sId = c.sections[0].id;

        // Mock a duplicate section
        const dupeSection = { ...c.sections[0] };
        c.sections.push(dupeSection);

        const result = validateUniqueIds(c);
        expect(result.isValid).toBe(false);
        expect(result.issues[0].message).toContain('Duplicate ID');
    });
});
