import { SeatMapConfig, SeatDefinition, Section, Row, Point } from '../models/seat-map.types';

export interface ValidationIssue {
    type: 'error' | 'warning';
    message: string;
    entityId?: string; // ID of the section/row/seat causing issue
    details?: any;
}

export interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

const SEAT_SIZE = 30; // standard seat size for collision checking, could be config
const SEAT_BUFFER = 5; // minimum spacing

/**
 * Validates that no two seats overlap in the physical space.
 * All coordinates are resolved to global space for comparison.
 */
export function validateNoOverlaps(config: SeatMapConfig): ValidationResult {
    const issues: ValidationIssue[] = [];
    const occupiedSpaces: { x: number; y: number; id: string; label: string }[] = [];

    for (const section of config.sections) {
        for (const row of section.rows) {
            for (const seat of row.seats) {
                // Resolve global coordinates
                const globalX = section.position.x + row.position.x + seat.x;
                const globalY = section.position.y + row.position.y + seat.y;

                // Simple bounding box collision
                // Assuming seat is a circle/square of SEAT_SIZE centered at x,y OR top-left. 
                // Let's assume Top-Left for easier math, or Center. Let's stick to Top-Left for rendering simplicity usually.

                for (const existing of occupiedSpaces) {
                    const dist = Math.sqrt(Math.pow(globalX - existing.x, 2) + Math.pow(globalY - existing.y, 2));

                    if (dist < SEAT_SIZE - SEAT_BUFFER) { // If they are too close
                        issues.push({
                            type: 'error',
                            message: `Seat Overlap detected: ${seat.label} overlaps with ${existing.label}`,
                            entityId: seat.id,
                            details: { seat1: seat.id, seat2: existing.id }
                        });
                    }
                }

                occupiedSpaces.push({ x: globalX, y: globalY, id: seat.id, label: seat.label });
            }
        }
    }

    return { isValid: issues.length === 0, issues };
}

/**
 * Validates that all IDs (Section, Row, Seat) are globally unique.
 */
export function validateUniqueIds(config: SeatMapConfig): ValidationResult {
    const issues: ValidationIssue[] = [];
    const ids = new Set<string>();

    function check(id: string, type: string) {
        if (ids.has(id)) {
            issues.push({
                type: 'error',
                message: `Duplicate ID found: ${id} (${type})`,
                entityId: id
            });
        }
        ids.add(id);
    }

    for (const section of config.sections) {
        check(section.id, 'Section');
        for (const row of section.rows) {
            check(row.id, 'Row');
            for (const seat of row.seats) {
                check(seat.id, 'Seat');
            }
        }
    }

    return { isValid: issues.length === 0, issues };
}

export function validateAll(config: SeatMapConfig): ValidationResult {
    const overlap = validateNoOverlaps(config);
    const unique = validateUniqueIds(config);

    return {
        isValid: overlap.isValid && unique.isValid,
        issues: [...overlap.issues, ...unique.issues]
    };
}
