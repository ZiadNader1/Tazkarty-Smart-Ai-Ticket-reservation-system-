import { Component, ElementRef, Input, OnChanges, OnDestroy, AfterViewInit, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatMapConfig } from '../../../core/models/seat-map.types';
import { SeatMapCanvasRenderer } from '../seat-renderer/canvas-renderer';
import { InteractionEvent } from '../seat-renderer/seat-renderer.types';

@Component({
  selector: 'app-seat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('seatCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() config: SeatMapConfig | null = null;
  @Input() seatStatus: Map<string, string> = new Map();
  @Input() viewOnly = false;

  @Input() fitOnLoad = true;
  @Input() autoResize = false; // Opt-in for responsive behavior (viewer)
  @Input() interactionMode: 'select' | 'pan' | 'draw' = 'select'; // Replaces drawMode
  @Input() tierColors: Record<string, string> = {}; // New Input

  @Output() seatClick = new EventEmitter<InteractionEvent>();
  @Output() sectionCreate = new EventEmitter<any>();

  private renderer: SeatMapCanvasRenderer | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Interaction State
  private isDragging = false;
  private dragMode: 'pan' | 'section' | 'draw' | 'zone' | null = null;
  private dragTargetId: string | null = null;
  private lastMouse = { x: 0, y: 0 };
  private dragStartScreen = { x: 0, y: 0 };
  private transform = { scale: 1, x: 0, y: 0 };

  // Drawing State
  private dragStartPoint = { x: 0, y: 0 };
  private draftRect: { x: number, y: number, w: number, h: number } | null = null;
  private hasFitted = false; // Track initial fit state

  ngAfterViewInit() {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    this.renderer = new SeatMapCanvasRenderer(canvas);

    // Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas.parentElement!);

    this.resizeCanvas();

    // Listeners
    canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e)); // Window for drag outside
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    if (this.config && this.fitOnLoad) {
      this.autoFit();
    }
  }

  handleWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    const newScale = Math.max(0.1, Math.min(5, this.transform.scale * (1 + delta)));

    // Zoom towards mouse pointer
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mousseX = e.clientX - rect.left;
    const mousseY = e.clientY - rect.top;

    // Calculate offset adjustment to keep mouse point stable
    // worldX = (mouseX - tx) / scale
    // newTx = mouseX - worldX * newScale
    const worldX = (mousseX - this.transform.x) / this.transform.scale;
    const worldY = (mousseY - this.transform.y) / this.transform.scale;

    this.transform.x = mousseX - worldX * newScale;
    this.transform.y = mousseY - worldY * newScale;
    this.transform.scale = newScale;

    this.updateTransform();
  }

  handleMouseDown(e: MouseEvent) {
    if (!this.renderer) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Check for Pan
    // Explicit Pan Tool (Left) OR Middle Click
    if ((this.interactionMode === 'pan' && e.button === 0) || e.button === 1) {
      this.isDragging = true;
      this.dragMode = 'pan';
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.dragStartScreen = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

    // 2. Check for Draw Mode
    if (this.interactionMode === 'draw' && e.button === 0) {
      this.isDragging = true;
      this.dragMode = 'draw';
      // Convert to Logical Space
      const logicalX = (mouseX - this.transform.x) / this.transform.scale;
      const logicalY = (mouseY - this.transform.y) / this.transform.scale;
      this.dragStartPoint = { x: logicalX, y: logicalY };
      this.draftRect = { x: logicalX, y: logicalY, w: 0, h: 0 };
      return;
    }

    // 3. Check for Object Drag (Left Click) - Only in Select Mode
    if (this.interactionMode === 'select' && e.button === 0) {
      const hit = this.renderer.resolveClick(mouseX, mouseY);

      // Handle Seat/Section/Zone Click events first
      if (hit && hit.type === 'click') {
        const fullEvent: InteractionEvent = { ...hit, originalEvent: e };
        this.seatClick.emit(fullEvent);

        // Case A: Hit a Section (even if seat) -> Drag Section
        // User requested that clicking a seat also selects/drags the section.
        // Since we don't support individual seat dragging yet, grabbing a seat moves the section.
        if (hit.sectionId) {
          this.isDragging = true;
          this.dragMode = 'section';
          this.dragTargetId = hit.sectionId;
          this.lastMouse = { x: e.clientX, y: e.clientY };
          this.dragStartScreen = { x: e.clientX, y: e.clientY };
          return;
        }

        // Case B: Hit a Zone -> Drag Zone
        // @ts-ignore
        if (hit.zoneId) {
          this.isDragging = true;
          this.dragMode = 'zone'; // Custom ID
          // @ts-ignore
          this.dragTargetId = hit.zoneId;
          this.lastMouse = { x: e.clientX, y: e.clientY };
          this.dragStartScreen = { x: e.clientX, y: e.clientY };
          return;
        }
      }

      // Normal Click (Seat or Background)
      if (hit && (hit.type === 'click' || hit.type === 'background')) {
        // We already emitted click above if it was a hit type 'click', but if seat was clicked we didn't return.
        // Wait, if seat is clicked, we usually don't drag the seat individually.
        // So just emit.
        if (!hit.sectionId && !((hit as any).zoneId)) {
          // Background click only?
          const fullEvent: InteractionEvent = { ...hit, originalEvent: e };
          this.seatClick.emit(fullEvent);
        }
      }
    }
  }

  handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.lastMouse = { x: e.clientX, y: e.clientY };

      if (this.dragMode === 'pan') {
        this.transform.x += dx;
        this.transform.y += dy;
        this.updateTransform();
      } else if (this.dragMode === 'section' && this.dragTargetId && this.config) {
        // Drag Threshold Check
        const distSq = (e.clientX - this.dragStartScreen.x) ** 2 + (e.clientY - this.dragStartScreen.y) ** 2;
        if (distSq < 25) return;

        // Update Section Position
        const worldDx = dx / this.transform.scale;
        const worldDy = dy / this.transform.scale;

        const section = this.config.sections.find(s => s.id === this.dragTargetId);
        if (section) {
          section.position.x += worldDx;
          section.position.y += worldDy;
          this.renderer?.render(this.config, this.seatStatus);
        }
      } else if (this.dragMode === 'zone' && this.dragTargetId && this.config && this.config.zones) {
        // Drag Zone
        const distSq = (e.clientX - this.dragStartScreen.x) ** 2 + (e.clientY - this.dragStartScreen.y) ** 2;
        if (distSq < 25) return;

        const worldDx = dx / this.transform.scale;
        const worldDy = dy / this.transform.scale;

        const zone = this.config.zones.find(z => z.id === this.dragTargetId);
        if (zone) {
          zone.position.x += worldDx;
          zone.position.y += worldDy;
          this.renderer?.render(this.config, this.seatStatus);
        }
      } else if (this.dragMode === 'draw' && this.draftRect) {
        // ... (draw logic)
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const logicalX = (mouseX - this.transform.x) / this.transform.scale;
        const logicalY = (mouseY - this.transform.y) / this.transform.scale;

        this.draftRect.w = logicalX - this.dragStartPoint.x;
        this.draftRect.h = logicalY - this.dragStartPoint.y;

        if (this.renderer && this.config) {
          this.renderer.render(this.config, this.seatStatus);
          this.renderer.drawDraftBox(this.draftRect);
        }
      }
    }
  }

  handleMouseUp(e: MouseEvent) {
    if (this.isDragging && this.dragMode === 'draw' && this.draftRect) {
      // Finalize creation
      const finalRect = {
        x: this.draftRect.w < 0 ? this.draftRect.x + this.draftRect.w : this.draftRect.x,
        y: this.draftRect.h < 0 ? this.draftRect.y + this.draftRect.h : this.draftRect.y,
        w: Math.abs(this.draftRect.w),
        h: Math.abs(this.draftRect.h)
      };

      if (finalRect.w > 10 && finalRect.h > 10) {
        this.sectionCreate.emit(finalRect);
      }
      this.draftRect = null;
      if (this.renderer && this.config) this.renderer.render(this.config, this.seatStatus); // Clear draft
    }
    this.isDragging = false;
    this.dragMode = null;
    this.dragTargetId = null;
  }

  private updateTransform() {
    if (this.renderer) {
      this.renderer.setTransform(this.transform.scale, this.transform.x, this.transform.y);
    }
  }

  // Legacy Click Handler (modified to use current transform if needed, but renderer handles hit test reverse transform)
  private handleClick(e: MouseEvent) {
    // We only trigger click if NOT dragging/panning
    if (this.isDragging) return;

    // ... existing click logic ... 
    // Note: MouseDown usually starts drag, MouseUp ends it. 
    // A "Click" is Down+Up without move. 
    // For simplicity, we delegate click logic to "Down" in 'handleClick' in original code, 
    // OR we should move 'handleClick' to 'MouseUp' if delta < threshold.
    // Let's keep it simple: MouseDown triggers click if not panning mode.

    if (!this.renderer) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const event = this.renderer.resolveClick(x, y);

    if (event && (event.type === 'click' || event.type === 'background')) {
      const fullEvent: InteractionEvent = { ...event, originalEvent: e };
      this.seatClick.emit(fullEvent);
    }
  }

  private initRenderer() {
    if (!this.canvasRef || !this.config) return;

    this.renderer = new SeatMapCanvasRenderer(this.canvasRef.nativeElement, {
      scale: this.transform.scale,
      offsetX: this.transform.x,
      offsetY: this.transform.y,
      tierColors: this.tierColors, // Pass it here
      // colorScheme defaults are fine
    });

    this.renderer.render(this.config, this.seatStatus);
  }

  ngOnChanges(changes: any) {
    if (changes.config || changes.seatStatus) {
      if (this.renderer && this.config) {
        this.renderer.render(this.config, this.seatStatus);
      } else {
        this.initRenderer();
      }
    }
    // If tierColors change (deep check might be needed or reference change)
    if (changes.tierColors && this.renderer) {
      this.initRenderer();
    }
  }

  private resizeCanvas() {
    if (!this.renderer || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (this.config) {
        if (this.autoResize) {
          this.autoFit();
        } else if (this.fitOnLoad && !this.hasFitted) {
          this.autoFit();
        } else {
          this.renderer.render(this.config, this.seatStatus);
        }
      }
    }
  }

  public autoFit() {
    if (!this.renderer || !this.config || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    // Check if canvas has size
    if (canvas.width === 0 || canvas.height === 0) {
      // Retry in case of layout timing issues
      setTimeout(() => this.autoFit(), 100);
      return;
    }

    this.hasFitted = true;

    // Calculate Content Bounding Box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    let hasContent = false;

    // Sections
    if (this.config.sections) {
      for (const section of this.config.sections) {
        hasContent = true;
        minX = Math.min(minX, section.position.x);
        minY = Math.min(minY, section.position.y);
        maxX = Math.max(maxX, section.position.x + section.dimensions.width);
        maxY = Math.max(maxY, section.position.y + section.dimensions.height);
      }
    }

    // Zones
    if (this.config.zones) {
      for (const zone of this.config.zones) {
        hasContent = true;
        minX = Math.min(minX, zone.position.x);
        minY = Math.min(minY, zone.position.y);
        maxX = Math.max(maxX, zone.position.x + zone.dimensions.width);
        maxY = Math.max(maxY, zone.position.y + zone.dimensions.height);
      }
    }

    // Stage
    if (this.config.stage) {
      hasContent = true;
      minX = Math.min(minX, this.config.stage.position.x);
      minY = Math.min(minY, this.config.stage.position.y);
      maxX = Math.max(maxX, this.config.stage.position.x + this.config.stage.dimensions.width);
      maxY = Math.max(maxY, this.config.stage.position.y + this.config.stage.dimensions.height);
    }

    // Fallback if empty or single point
    if (!hasContent) {
      minX = 0; minY = 0; maxX = 1000; maxY = 800; // Default logical space
    } else if (maxX === minX || maxY === minY) {
      maxX = minX + 100;
      maxY = minY + 100;
    }

    // Add padding (5% each side)
    const contentW = maxX - minX;
    const contentH = maxY - minY;

    // Scale to fit
    const scaleX = canvas.width / (contentW * 1.05);
    const scaleY = canvas.height / (contentH * 1.05);
    const scale = Math.min(scaleX, scaleY); // Fit entirely

    // Center
    // Center of content in world space = minX + contentW/2
    // Center of canvas in screen space = canvas.width/2
    // formula: tx = canvasCenter - worldCenter * scale

    const worldCenterX = minX + contentW / 2;
    const worldCenterY = minY + contentH / 2;

    const x = (canvas.width / 2) - (worldCenterX * scale);
    const y = (canvas.height / 2) - (worldCenterY * scale);



    this.transform = { scale, x, y };
    this.updateTransform();
  }

  public manualZoom(factor: number) {
    if (!this.renderer) return;
    const newScale = Math.max(0.1, Math.min(5, this.transform.scale * factor));

    // Zoom from center of screen not mouse
    const canvas = this.canvasRef.nativeElement;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const worldX = (centerX - this.transform.x) / this.transform.scale;
    const worldY = (centerY - this.transform.y) / this.transform.scale;

    this.transform.x = centerX - worldX * newScale;
    this.transform.y = centerY - worldY * newScale;
    this.transform.scale = newScale;

    this.updateTransform();
  }



  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.renderer?.destroy();
  }
}
