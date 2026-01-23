import { SeatMapConfig, SeatDefinition, Section, Row } from '../../../core/models/seat-map.types';
import { SeatRenderer, RenderOptions, InteractionEvent } from './seat-renderer.types';

export class SeatMapCanvasRenderer implements SeatRenderer {
    private ctx: CanvasRenderingContext2D;
    private options: RenderOptions;
    private currentConfig: SeatMapConfig | null = null;

    // Cache standard seat path for performance
    private seatPath: Path2D;

    constructor(
        private canvas: HTMLCanvasElement,
        options?: Partial<RenderOptions>
    ) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');
        this.ctx = ctx;

        this.options = {
            showLabels: true,
            showSectionLabels: true,
            colorScheme: {
                background: '#f5f5f5',
                seatStandard: '#4caf50', // Available (Green)
                seatVip: '#9c27b0', // VIP (Purple)
                seatUnavailable: '#e53935', // Occupied (Red)
                seatSelected: '#ffeb3b', // Selected (Yellow)
                text: '#333333',
                ...options?.colorScheme
            },
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            ...options
        };

        // Create a simple chair shape (30x30 default)
        this.seatPath = new Path2D();
        // Top curve (backrest)
        this.seatPath.arc(15, 10, 10, Math.PI, 0);
        // Bottom sq (seat)
        this.seatPath.rect(5, 10, 20, 15);
        this.seatPath.closePath();
    }

    setTransform(scale: number, offsetX: number, offsetY: number) {
        this.options.scale = scale;
        this.options.offsetX = offsetX;
        this.options.offsetY = offsetY;
        if (this.currentConfig) {
            this.render(this.currentConfig);
        }
    }

    render(config: SeatMapConfig, runtimeStatus: Map<string, string> = new Map()): void {
        this.currentConfig = config;
        const { width, height } = this.canvas;
        const { scale, offsetX, offsetY, colorScheme } = this.options;

        // Clear
        this.ctx.clearRect(0, 0, width, height);

        // Background
        this.ctx.fillStyle = colorScheme.background;
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.save();

        this.renderGrid(width, height, scale, offsetX, offsetY);

        // Apply transform
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(scale, scale);

        // 1. Draw Zones (Background layer)
        if (config.zones) {
            for (const zone of config.zones) {
                this.renderZone(zone);
            }
        }

        // 2. Draw Stage
        if (config.stage) {
            this.renderStage(config.stage);
        }

        // 3. Draw Sections
        for (const section of config.sections) {
            this.renderSection(section, runtimeStatus);
        }

        this.ctx.restore();
    }

    private renderZone(zone: any) {
        if (!zone || !zone.position || !zone.dimensions) {
            console.warn('Invalid zone data:', zone);
            return;
        }
        const { x, y } = zone.position;
        const { width, height } = zone.dimensions;
        const rotation = zone.rotation || 0;

        this.ctx.save();

        // Pivot around center
        const cx = x + width / 2;
        const cy = y + height / 2;

        this.ctx.translate(cx, cy);
        if (rotation) {
            this.ctx.rotate((rotation * Math.PI) / 180);
        }
        this.ctx.translate(-cx, -cy);

        // Fill
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = zone.color || '#ff0000';
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = zone.color || '#ff0000';
        this.ctx.strokeRect(x, y, width, height);

        // Label
        this.ctx.save();
        this.ctx.globalAlpha = 0.2; // Low opacity as requested
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(zone.label, x + width / 2, y + 10);
        this.ctx.restore();

        this.ctx.restore();
    }

    // ... (renderGrid and renderStage methods remain same, implicitly included via matching context if needed)

    resolveClick(x: number, y: number): InteractionEvent | null {
        // Inverse transform
        const logicalX = (x - this.options.offsetX) / this.options.scale;
        const logicalY = (y - this.options.offsetY) / this.options.scale;

        if (!this.currentConfig) return null;

        // 1. Check Seats
        for (const section of this.currentConfig.sections) {
            if (!section || !section.position || !section.dimensions) continue;

            // Rotation Aware Hit Test
            let testX = logicalX;
            let testY = logicalY;

            if (section.rotation) {
                const cx = section.position.x + section.dimensions.width / 2;
                const cy = section.position.y + section.dimensions.height / 2;
                const rad = (section.rotation * Math.PI) / 180;

                const dx = logicalX - cx;
                const dy = logicalY - cy;
                const cos = Math.cos(-rad);
                const sin = Math.sin(-rad);

                testX = cx + (dx * cos - dy * sin);
                testY = cy + (dx * sin + dy * cos);
            }

            for (const row of section.rows) {
                for (const seat of row.seats) {
                    const gx = section.position.x + row.position.x + seat.x;
                    const gy = section.position.y + row.position.y + seat.y;

                    if (testX >= gx && testX <= gx + 30 &&
                        testY >= gy && testY <= gy + 30) {
                        return {
                            type: 'click',
                            seat: seat,
                            sectionId: section.id,
                            point: { x: logicalX, y: logicalY }
                        };
                    }
                }
            }

            // Check Section Bounds
            if (testX >= section.position.x && testX <= section.position.x + section.dimensions.width &&
                testY >= section.position.y && testY <= section.position.y + section.dimensions.height) {
                return {
                    type: 'click',
                    sectionId: section.id,
                    point: { x: logicalX, y: logicalY }
                };
            }
        }

        // 2. Check Zones
        if (this.currentConfig.zones) {
            for (const zone of this.currentConfig.zones) {
                if (!zone || !zone.position || !zone.dimensions) continue;

                // Rotation aware hit test for Zone
                let testX = logicalX;
                let testY = logicalY;

                // Check if zone has rotation
                if ((zone as any).rotation) {
                    const r = (zone as any).rotation;
                    const cx = zone.position.x + zone.dimensions.width / 2;
                    const cy = zone.position.y + zone.dimensions.height / 2;
                    const rad = (r * Math.PI) / 180;

                    // Rotate backward
                    const dx = logicalX - cx;
                    const dy = logicalY - cy;
                    const cos = Math.cos(-rad);
                    const sin = Math.sin(-rad);

                    testX = cx + (dx * cos - dy * sin);
                    testY = cy + (dx * sin + dy * cos);
                }

                if (testX >= zone.position.x && testX <= zone.position.x + zone.dimensions.width &&
                    testY >= zone.position.y && testY <= zone.position.y + zone.dimensions.height) {
                    return {
                        type: 'click',
                        // @ts-ignore
                        zoneId: zone.id,
                        point: { x: logicalX, y: logicalY }
                    } as any;
                }
            }
        }

        // Return background click
        return {
            type: 'background',
            point: { x: logicalX, y: logicalY }
        };
    }

    private renderGrid(w: number, h: number, scale: number, ox: number, oy: number) {
        // Simple Grid
        const step = 20 * scale;
        // If step is too small, don't draw or draw larger steps
        if (step < 5) return;

        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Calculate start/end based on offset to emulate infinite grid
        const startX = (ox % step);
        const startY = (oy % step);

        for (let x = startX; x < w; x += step) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
        }
        for (let y = startY; y < h; y += step) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
        }
        this.ctx.stroke();
    }

    private renderStage(stage: NonNullable<SeatMapConfig['stage']>) {
        if (!stage || !stage.position || !stage.dimensions) return;
        const { x, y } = stage.position;
        const { width, height } = stage.dimensions;

        // Draw Stage
        this.ctx.save();
        this.ctx.fillStyle = '#ddd'; // Stage color
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 2;

        // Simple Arc or Rect
        if (stage.type === 'arc') {
            this.ctx.beginPath();
            this.ctx.ellipse(x + width / 2, y + height, width / 2, height, 0, Math.PI, 0); // Half oval
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            this.ctx.fillRect(x, y, width, height);
            this.ctx.strokeRect(x, y, width, height);
        }

        // Label
        this.ctx.fillStyle = '#666';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(stage.label || 'STAGE', x + width / 2, y + height / 2);

        this.ctx.restore();
    }

    private renderSection(section: Section, runtimeStatus: Map<string, string>) {
        if (!section || !section.position || !section.dimensions) {
            console.warn('Invalid section data:', section);
            return;
        }
        this.ctx.save();

        // Pivot around center
        const cx = section.position.x + section.dimensions.width / 2;
        const cy = section.position.y + section.dimensions.height / 2;

        this.ctx.translate(cx, cy);
        if (section.rotation) {
            this.ctx.rotate((section.rotation * Math.PI) / 180);
        }
        this.ctx.translate(-cx, -cy);

        if (this.options.showSectionLabels) {
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillStyle = this.options.colorScheme.text;
            this.ctx.textAlign = 'center'; // Center alignment

            // Calculate top-most row position to place label just above it
            let topRowY = 50; // default offset
            if (section.rows.length > 0) {
                const minRowY = section.rows.reduce((min, r) => Math.min(min, r.position.y), Infinity);
                if (minRowY !== Infinity) {
                    topRowY = Math.max(20, minRowY - 20); // 20px padding above row, but at least 20px from top
                }
            }

            // Center horizontally
            const labelX = section.position.x + section.dimensions.width / 2;
            const labelY = section.position.y + topRowY;
            this.ctx.fillText(section.label, labelX, labelY);
        }

        if (this.options.showSectionLabels) {
            // ... (keep label logic)
            // But wait, label logic is huge in the file view, I should leave it alone or replicate carefully.
            // Actually, I can just insert the background drawing BEFORE the label or GA check.
        }

        // Draw Section Background (if color exists)
        // Works for both Assigned and GA
        // Draw Section Background (if color exists or GA)
        // Works for both Assigned and GA
        // NEW: Calculate bounds based on seats if they exist
        let sX = section.position.x;
        let sY = section.position.y;
        let sW = section.dimensions.width;
        let sH = section.dimensions.height;

        let hasContent = false;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Iterate seats to find bounds
        for (const row of section.rows) {
            for (const seat of row.seats) {
                // Determine seat local pos relative to section
                const lx = row.position.x + seat.x;
                const ly = row.position.y + seat.y;
                hasContent = true;
                if (lx < minX) minX = lx;
                if (ly < minY) minY = ly;
                // Seat size is ~30x30 usually. 30 is visual size.
                if (lx + 30 > maxX) maxX = lx + 30;
                if (ly + 30 > maxY) maxY = ly + 30;
            }
        }

        if (hasContent) {
            // Add some padding
            const padding = 20;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            sX = section.position.x + minX;
            sY = section.position.y + minY;
            sW = maxX - minX;
            sH = maxY - minY;
        }

        // Only draw background if requested or debug
        // Logic: specific section color, OR default GA background
        if (section.color) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3; // Semi-transparent
            this.ctx.fillStyle = section.color;
            this.ctx.fillRect(sX, sY, sW, sH);
            this.ctx.globalAlpha = 1.0;

            // Optional Border if colored
            this.ctx.strokeStyle = section.color;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(sX, sY, sW, sH);
            this.ctx.restore();
        } else if (section.type === 'ga') {
            // GA Default Gray if no color
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(240, 240, 240, 0.5)';
            this.ctx.fillRect(sX, sY, sW, sH);
            this.ctx.strokeStyle = '#999';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(sX, sY, sW, sH);
            this.ctx.restore();
        }

        // GA Specific Text & Skip Seats
        if (section.type === 'ga') {
            this.ctx.save();
            this.ctx.fillStyle = '#666';
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`GA Area`, sX + sW / 2, sY + sH / 2 - 10);
            this.ctx.font = '14px sans-serif';
            this.ctx.fillText(`Cap: ${section.capacity || 0}`, sX + sW / 2, sY + sH / 2 + 10);
            this.ctx.restore();
            return; // Skip drawing rows
        }

        for (const row of section.rows) {
            // Visualize Arc (Hidden per user request, can be re-enabled for debug)
            /* 
            if (row.radius && row.radius > 0) {
                // ... code hidden ...
            }
            */
            // Or just skip it

            for (const seat of row.seats) {
                this.renderSeat(seat, section, row, runtimeStatus);
            }
        }
        this.ctx.restore();
    }

    private renderSeat(seat: SeatDefinition, section: Section, row: Row, runtimeStatus: Map<string, string>) {
        const globalX = section.position.x + row.position.x + seat.x;
        const globalY = section.position.y + row.position.y + seat.y;

        const status = runtimeStatus.get(seat.id) || seat.status || 'available';

        this.ctx.save();
        this.ctx.translate(globalX, globalY);

        if (status === 'gap') {
            // Faint marker for editor, distinct from regular seat
            this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            this.ctx.rect(5, 10, 20, 15); // Seat outline size
            this.ctx.stroke();
            this.ctx.restore();
            return;
        }

        // Determine Color
        let fill = this.options.colorScheme.seatStandard;

        // Dynamic Tier Lookup
        if (this.options.tierColors && this.options.tierColors[seat.type]) {
            fill = this.options.tierColors[seat.type];
        } else if (seat.type === 'vip') {
            fill = this.options.colorScheme.seatVip;
        }

        if (status === 'disabled') fill = '#e0e0e0';
        if (status === 'booked' || status === 'sold') fill = this.options.colorScheme.seatUnavailable;
        if (status === 'locked') fill = '#ff9800';
        if (status === 'selected') fill = this.options.colorScheme.seatSelected;

        this.ctx.fillStyle = fill;
        this.ctx.fill(this.seatPath);

        // Stroke
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#666';
        if (status === 'disabled') this.ctx.strokeStyle = '#bdbdbd';
        this.ctx.stroke(this.seatPath);

        // Label
        if (this.options.showLabels && status !== 'disabled') {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(seat.label, 15, 20);
        }
        this.ctx.restore();
    }



    destroy(): void {
        // Clear references
        this.currentConfig = null;
    }

    drawDraftBox(rect: { x: number, y: number, w: number, h: number }) {
        const { scale, offsetX, offsetY } = this.options;

        // Convert Logical to Screen
        const sx = rect.x * scale + offsetX;
        const sy = rect.y * scale + offsetY;
        const sw = rect.w * scale;
        const sh = rect.h * scale;

        this.ctx.save();
        this.ctx.strokeStyle = '#2196F3'; // Blue
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';

        this.ctx.fillRect(sx, sy, sw, sh);
        this.ctx.strokeRect(sx, sy, sw, sh);

        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = '#1565C0';
        // Add size label
        this.ctx.fillText(`${Math.round(Math.abs(rect.w))} x ${Math.round(Math.abs(rect.h))}`, sx + 5, sy - 5);

        this.ctx.restore();
    }
}
