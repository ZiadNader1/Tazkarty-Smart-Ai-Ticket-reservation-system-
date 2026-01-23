import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeatMapConfig, Section, Row, SeatDefinition, Zone } from '../../../../core/models/seat-map.types';
import { SeatMap } from '../../../../shared/components/seat-map/seat-map';
import { InteractionEvent } from '../../../../shared/components/seat-renderer/seat-renderer.types';
import { SeatGenerator } from '../../../../core/logic/seat-generator';


import { EventsService } from '../../../../core/services/events.service';

@Component({
    selector: 'app-seat-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, SeatMap],
    templateUrl: './seat-editor.html',
    styleUrls: ['./seat-editor.scss']
})
export class SeatEditorComponent implements AfterViewInit, OnInit {
    @ViewChild(SeatMap) seatMapComponent!: SeatMap;

    hallId: string | null = null;
    hallName: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventsService: EventsService
    ) { }

    // Editor State
    selectedSections: Section[] = [];
    selectedZone: Zone | null = null;
    selectedRow: Row | null = null;
    selectedSeat: SeatDefinition | null = null;
    selectedTool: 'select' | 'add-section' | 'add-zone' | 'add-row' | 'eraser' | 'lock' = 'select';

    // Helper for single selection compatibility
    get selectedSection(): Section | null {
        return this.selectedSections.length > 0 ? this.selectedSections[0] : null;
    }
    set selectedSection(value: Section | null) {
        if (value) {
            this.selectedSections = [value];
        } else {
            this.selectedSections = [];
        }
    }

    // UI State
    GRID_SIZE = 20;
    isSaving = false;
    isLoading = false;
    isDrawMode = false;
    error: string | null = null;
    successMessage: string | null = null;
    validationIssues: { message: string }[] = [];

    // History (Undo/Redo)
    history: string[] = []; // Store JSON strings for deep copy simplicity
    historyIndex = -1;

    // Tier / Category Management
    pricingTiers: { name: string, color: string }[] = [
        { name: 'Standard', color: '#aaaaaa' },
        { name: 'VIP', color: '#ffd700' },
        { name: 'Wheelchair', color: '#2196F3' }
    ];

    // Computed Tier Colors for Renderer
    // Tier Maps
    tierColorMap: Record<string, string> = {};

    updateTierMap() {
        const map: Record<string, string> = {};
        this.pricingTiers.forEach(t => map[t.name.toLowerCase()] = t.color);
        this.tierColorMap = map;
    }

    addTier(name: string, color: string) {
        if (!name) return;
        this.pricingTiers.push({ name, color });
        this.updateTierMap();
    }

    removeTier(index: number) {
        if (this.pricingTiers.length > 1) { // Prevent deleting last one
            this.pricingTiers.splice(index, 1);
            this.updateTierMap();
        }
    }

    // Stage Management
    addStage() {
        if (this.config.stage) return;
        this.config = {
            ...this.config,
            stage: {
                label: 'Main Stage',
                position: { x: 100, y: 0 },
                dimensions: { width: 600, height: 100 },
                rotation: 0
            }
        };
        this.saveState();
    }

    removeStage() {
        if (!this.config.stage) return;
        this.config = { ...this.config, stage: undefined };
        this.saveState();
    }

    deleteSection() {
        if (!this.selectedSection) return;
        const idx = this.config.sections.findIndex(s => s.id === this.selectedSection!.id);
        if (idx !== -1) {
            this.config.sections.splice(idx, 1);
            this.selectedSections = [];
            this.selectedRow = null;
            this.selectedSeat = null;
            this.refreshMap();
            this.saveState();
        }
    }

    deleteZone() {
        if (!this.selectedZone) return;
        if (!this.config.zones) return;
        const idx = this.config.zones.findIndex(z => z.id === this.selectedZone!.id);
        if (idx !== -1) {
            this.config.zones.splice(idx, 1);
            this.selectedZone = null;
            this.refreshMap();
            this.saveState();
        }
    }

    deleteRow() {
        if (!this.selectedRow || !this.selectedSection) return;
        const idx = this.selectedSection.rows.findIndex(r => r === this.selectedRow);
        if (idx !== -1) {
            this.selectedSection.rows.splice(idx, 1);
            this.selectedRow = null;
            this.selectedSeat = null;
            this.refreshMap();
            this.saveState();
        }
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.hallId = params.get('id');
            if (this.hallId) {
                this.loadMap();
            }
        });
    }

    ngAfterViewInit() {
        // View initialized
    }

    loadMap() {
        if (!this.hallId) return;
        this.isLoading = true;
        this.eventsService.getHallById(this.hallId).subscribe({
            next: (hall) => {
                this.hallName = hall.name;


                if (hall.seat_map_config) {


                }

                if (hall.seat_map_config && hall.seat_map_config.sections) {

                    this.config = hall.seat_map_config;
                    // Ensure deep copy for history
                    this.history = [JSON.stringify(this.config)];
                    this.historyIndex = 0;
                    this.updateTierMap(); // Init colors
                } else {

                    // Initialize default if new
                    this.initializeDefaultMap();
                }
                this.isLoading = false;
                // Force refresh
                // Force refresh and fit
                setTimeout(() => {
                    this.refreshMap();
                    if (this.seatMapComponent) this.seatMapComponent.autoFit();
                });
            },
            error: (err) => {
                console.error('Error loading hall:', err);
                this.error = 'Failed to load hall data';
                this.isLoading = false;
            }
        });
    }

    initializeDefaultMap() {
        // Create initial section and row logic (moved from ngAfterViewInit)
        // Initialize default map
        if (!this.config.sections) this.config.sections = [];

        const defaultSection: Section = {
            id: crypto.randomUUID(),
            label: 'Section A',
            rows: [],
            position: { x: 100, y: 100 },
            dimensions: { width: 400, height: 400 },
            rotation: 0
        };
        this.config.sections.push(defaultSection);
        this.selectedSection = defaultSection;
        this.addRow(); // Add default row

        this.saveState();
        this.updateTierMap();
        setTimeout(() => { if (this.seatMapComponent) this.seatMapComponent.autoFit(); });
    }

    // Getters for Template
    get selectedElement(): any {
        return this.selectedRow || this.selectedSeat || this.selectedSection || this.selectedZone;
    }

    config: SeatMapConfig = {
        version: 1,
        width: 1000,
        height: 800,
        zones: [],
        sections: []
    };

    // ...

    get selectedType(): 'row' | 'section' | 'seat' | 'zone' | null {
        if (this.selectedRow) return 'row';
        if (this.selectedSeat) return 'seat';
        if (this.selectedSection) return 'section';
        if (this.selectedZone) return 'zone';
        return null;
    }

    get interactionMode(): 'select' | 'pan' | 'draw' {
        if (this.isDrawMode || this.selectedTool === 'add-section' || this.selectedTool === 'add-zone') return 'draw';
        return 'select';
    }

    // ...

    addZone() {
        this.selectedTool = 'add-zone';
        this.isDrawMode = true;
        this.selectedSection = null;
        this.selectedRow = null;
        this.selectedSeat = null;
        this.selectedZone = null;
    }

    addSection() {
        this.selectedTool = 'add-section';
        this.isDrawMode = true;
        this.selectedSection = null;
        this.selectedRow = null;
        this.selectedSeat = null;
        this.selectedZone = null;
    }

    // Renamed internal handler or kept same name but modified logic
    onSeatClick(event: InteractionEvent) {
        // Handle Zone Click
        if ((event as any).zoneId) {
            const zone = this.config.zones?.find(z => z.id === (event as any).zoneId);
            if (zone) {
                this.selectZone(zone);
                return;
            }
        }

        // Handle Background Click
        if (event.type === 'background') {
            this.selectedSections = [];
            this.selectedRow = null;
            this.selectedSeat = null;
            this.selectedZone = null;
            return;
        }

        // Handle Seat Click
        if (event.seat && event.sectionId) {
            // Tool Check First
            if (this.selectedTool === 'eraser') {
                event.seat.status = 'gap';
                this.refreshMap();
                this.saveState();
                return;
            }
            if (this.selectedTool === 'lock') {
                event.seat.status = event.seat.status === 'disabled' ? 'available' : 'disabled';
                this.refreshMap();
                this.saveState();
                return;
            }

            const section = this.config.sections.find(s => s.id === event.sectionId);
            if (section) {
                // If section is not selected, select it
                if (!this.selectedSections.some(s => s.id === section.id)) {
                    this.selectSection(section);
                }

                // If seat belongs to a row, select row
                // Find row
                const row = section.rows.find(r => r.seats.includes(event.seat!));
                if (row) {
                    this.selectedRow = row;
                }

                this.selectedSeat = event.seat;
                this.selectedZone = null;
            }
            return;
        }

        // Handle Section Click (if clicking section body but not seat - though sections are just seats now)
        // But renderer might return sectionId for clicks near seats if we implemented it that way.
        if (event.sectionId) {
            const section = this.config.sections.find(s => s.id === event.sectionId);
            if (section) {
                this.selectSection(section);
            }
        }
    }

    selectZone(zone: Zone) {
        this.selectedZone = zone;
        this.selectedSection = null; // Clear section selection
        this.selectedRow = null;
        this.selectedSeat = null;
    }

    // Renamed internal handler or kept same name but modified logic
    onSectionCreate(rect: { x: number, y: number, w: number, h: number }) {
        if (this.selectedTool === 'add-zone') {
            const newZone: Zone = {
                id: crypto.randomUUID(),
                label: `Zone ${this.config.zones ? this.config.zones.length + 1 : 1}`,
                position: { x: rect.x, y: rect.y },
                dimensions: { width: rect.w, height: rect.h },
                color: '#ff0000' // Default Red
            };
            if (!this.config.zones) this.config.zones = [];
            this.config.zones.push(newZone);
            this.selectedZone = newZone;

            // UX Fix: Switch to select mode
            this.selectedTool = 'select';
            this.isDrawMode = false;
        } else {
            // Default Add Section
            const newSection: Section = {
                id: crypto.randomUUID(),
                label: `Section ${this.config.sections.length + 1}`,
                rows: [],
                position: { x: rect.x, y: rect.y },
                dimensions: { width: rect.w, height: rect.h }
            };
            this.config.sections.push(newSection);
            this.selectSection(newSection);

            // UX Fix: Switch to select mode
            this.selectedTool = 'select';
            this.isDrawMode = false;
        }

        this.refreshMap();
        this.saveState();
    }



    newRowSeatCount: number = 10; // Default

    addRow() {
        if (!this.selectedSection) {
            this.error = "Please select a section first.";
            setTimeout(() => this.error = null, 3000);
            return;
        }

        const rowCount = this.selectedSection.rows.length;
        // Determine label (A, B, C...)
        const label = String.fromCharCode(65 + rowCount); // 65 = 'A'

        // Default spacing/radius based on previous row?
        // For now simple default
        const newRow: Row = {
            id: crypto.randomUUID(),
            label: label,
            seats: [],
            position: { x: 300, y: 300 + (rowCount * 40) }, // Offset Y
            radius: 200,
            startAngle: 180,
            endAngle: 360,
            seatCount: this.newRowSeatCount
        };

        // Generate seats
        this.updateRowSeats(newRow);

        this.selectedSection.rows.push(newRow);
        this.selectRow(newRow); // Select it
        this.selectedSeat = null; // Deselect seat

        this.refreshMap();
        this.saveState();
    }

    addSeat() {
        // Not implemented for curved maps directly yet
    }

    selectRow(row: Row) {
        this.selectedRow = row;
        this.selectedSeat = null;
        // Keep section selected? Yes.
    }

    selectSection(section: Section, multi = false) {
        if (multi) {
            const index = this.selectedSections.findIndex(s => s.id === section.id);
            if (index !== -1) {
                this.selectedSections.splice(index, 1);
            } else {
                this.selectedSections.push(section);
            }
        } else {
            this.selectedSections = [section];
        }

        this.selectedRow = null;
        this.selectedSeat = null;
    }



    onRowParamChange() {
        if (this.selectedRow) {
            this.updateRowSeats(this.selectedRow);
            this.saveState();
        }
    }

    onSectionTypeChange(type: 'assigned' | 'ga') {
        if (!this.selectedSection) return;
        this.selectedSection.type = type;
        this.refreshMap();
        this.saveState();
    }

    updateSectionLayout(type: 'curved' | 'linear') {
        if (!this.selectedSection) return;

        this.selectedSection.rows.forEach(row => {
            row.rowType = type;
            // Set default spacing if linear and not set
            if (type === 'linear' && !row.spacing) {
                row.spacing = 35;
            }
            // Regenerate seats
            const newSeats = SeatGenerator.updateRowSeats(row);
            row.seats = newSeats;
        });
        this.refreshMap();
        this.saveState();
    }

    updateRowSeats(row: Row) {
        // When parameters change, we recreate seats but try to preserve Type/Status if possible?
        // Current implementation of 'SeatGenerator.updateRowSeats' probably creates NEW seats.
        // We should backup status/type map if we want to preserve them.
        // For now, let's just regenerate. Phase 4 polish: Preserve data.
        const prevSeats = row.seats;
        const newSeats = SeatGenerator.updateRowSeats(row);

        // Naive preservation of types if count matches
        if (prevSeats.length === newSeats.length) {
            for (let i = 0; i < newSeats.length; i++) {
                newSeats[i].type = prevSeats[i].type;
                newSeats[i].status = prevSeats[i].status;
            }
        }

        row.seats = newSeats;
        this.refreshMap();
    }

    updateRowCategory(type: string) {
        if (this.selectedRow) {
            this.selectedRow.seats.forEach(s => s.type = type);
            this.refreshMap();
            this.saveState();
        }
    }

    refreshMap() {
        this.config = {
            ...this.config,
            sections: [...this.config.sections]
        };
    }

    // History Management
    saveState() {
        // Clear redo stack
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        const state = JSON.stringify(this.config);
        // Avoid dups
        if (this.history.length > 0 && this.history[this.historyIndex] === state) return;

        this.history.push(state);
        this.historyIndex++;

        // Limit history size? 50
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState();
        }
    }

    restoreState() {
        try {
            this.config = JSON.parse(this.history[this.historyIndex]);
            this.selectedRow = null;
            this.selectedSeat = null;
            this.selectedSection = null;
        } catch (e) {
            console.error('Failed to restore state', e);
        }
    }

    align(mode: 'left' | 'right' | 'top' | 'bottom' | 'center-x' | 'center-y' | 'distribute-x' | 'distribute-y') {
        if (this.selectedSections.length < 2) return;

        const sections = [...this.selectedSections];
        // For undo
        const previousState = JSON.stringify(this.config);

        switch (mode) {
            case 'left':
                const minX = Math.min(...sections.map(s => s.position.x));
                sections.forEach(s => s.position.x = minX);
                break;
            case 'right':
                const maxRight = Math.max(...sections.map(s => s.position.x + s.dimensions.width));
                sections.forEach(s => s.position.x = maxRight - s.dimensions.width);
                break;
            case 'top':
                const minY = Math.min(...sections.map(s => s.position.y));
                sections.forEach(s => s.position.y = minY);
                break;
            case 'bottom':
                const maxBottom = Math.max(...sections.map(s => s.position.y + s.dimensions.height));
                sections.forEach(s => s.position.y = maxBottom - s.dimensions.height);
                break;
            case 'center-x':
                const avgCenterX = sections.reduce((sum, s) => sum + (s.position.x + s.dimensions.width / 2), 0) / sections.length;
                sections.forEach(s => s.position.x = avgCenterX - s.dimensions.width / 2);
                break;
            case 'center-y':
                const avgCenterY = sections.reduce((sum, s) => sum + (s.position.y + s.dimensions.height / 2), 0) / sections.length;
                sections.forEach(s => s.position.y = avgCenterY - s.dimensions.height / 2);
                break;
            // Distribute: Sort then space evenly between first and last
            case 'distribute-x':
                sections.sort((a, b) => a.position.x - b.position.x);
                const firstX = sections[0].position.x;
                const last = sections[sections.length - 1];
                const lastX = last.position.x;
                const totalSpan = lastX - firstX;
                if (totalSpan > 0 && sections.length > 2) {
                    const step = totalSpan / (sections.length - 1);
                    sections.forEach((s, i) => {
                        s.position.x = firstX + (step * i);
                    });
                }
                break;
            case 'distribute-y':
                sections.sort((a, b) => a.position.y - b.position.y);
                const firstY = sections[0].position.y;
                const lastY = sections[sections.length - 1].position.y;
                const totalSpanY = lastY - firstY;
                if (totalSpanY > 0 && sections.length > 2) {
                    const step = totalSpanY / (sections.length - 1);
                    sections.forEach((s, i) => {
                        s.position.y = firstY + (step * i);
                    });
                }
                break;
        }

        this.refreshMap();
        this.saveState();
    }

    saveConfig() {
        if (!this.hallId) {
            this.error = "No Hall ID associated.";
            return;
        }

        this.isSaving = true;


        // Update version
        this.config.version = (this.config.version || 0) + 1;

        this.eventsService.updateHall(this.hallId, { seat_map_config: this.config }).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.successMessage = "Configuration saved successfully!";
                setTimeout(() => {
                    this.successMessage = null;
                    this.router.navigate(['../../'], { relativeTo: this.route });
                }, 1500);
            },
            error: (err) => {
                console.error('Save failed:', err);
                this.isSaving = false;
                this.error = "Failed to save configuration.";
                setTimeout(() => this.error = null, 3000);
            }
        });
    }

    zoomIn() {
        this.seatMapComponent?.manualZoom(1.2);
    }

    zoomOut() {
        this.seatMapComponent?.manualZoom(0.8);
    }

    resetView() {
        this.seatMapComponent?.autoFit();
    }

    toggleDrawMode() {
        this.isDrawMode = !this.isDrawMode;
        if (this.isDrawMode) {
            this.selectedSection = null;
            this.selectedRow = null;
            this.selectedSeat = null;
            this.selectedTool = 'select'; // or 'draw' visual processing
        }
    }
}
