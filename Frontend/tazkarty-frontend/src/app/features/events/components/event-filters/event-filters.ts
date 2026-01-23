import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EventFilter } from '../../../../models/event.model';
import { EventsService } from '../../../../core/services/events.service';

@Component({
  selector: 'app-event-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-filters.html',
  styles: [`
    :host { display: block; }
  `]
})
export class EventFilters implements OnInit, OnDestroy {
  @Output() filterChange = new EventEmitter<EventFilter>();

  filterForm: FormGroup;
  categories: any[] = [];
  venues: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService
  ) {
    this.filterForm = this.fb.group({
      query: [''],
      category: [''],
      venue: [''],
      dateFrom: [null],
      dateTo: [null],
      sort: ['date']
    });
  }

  get isEntertainment(): boolean {
    const cat = this.filterForm.get('category')?.value;
    return cat && cat.toLowerCase() === 'entertainment';
  }

  ngOnInit(): void {
    // 1. Load Filter Data
    this.loadFilterOptions();

    // 2. Sync from URL to Form (Initial Load)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.filterForm.patchValue({
        query: params['q'] || '',
        category: params['category'] || '',
        venue: params['venue'] || '',
        sort: params['sort'] || 'date'
      }, { emitEvent: false });
    });

    // 3. Listen to Form Changes -> Sync to URL & Emit
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.updateUrl(value);
        this.emitFilter(value);
      });
  }

  loadFilterOptions(): void {
    this.eventsService.getCategories().subscribe(cats => {
      this.categories = cats;
      // Add Virtual Category 'Entertainment'
      this.categories.unshift({ _id: 'entertainment', name: 'Entertainment' });
    });
    this.eventsService.getVenues().subscribe(venues => this.venues = venues);
  }

  updateUrl(formValue: any): void {
    const queryParams: any = {};
    if (formValue.query) queryParams.q = formValue.query;
    if (formValue.category) queryParams.category = formValue.category;
    if (formValue.venue) queryParams.venue = formValue.venue;
    if (formValue.sort) queryParams.sort = formValue.sort;
    // Date handling omitted for brevity, can be added if needed

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true // Don't clutter history
    });
  }

  emitFilter(formValue: any): void {
    const filter: EventFilter = {
      query: formValue.query,
      category: formValue.category,
      venue: formValue.venue,
      sort: formValue.sort
    };
    this.filterChange.emit(filter);
  }

  resetFilters(): void {
    this.filterForm.reset({ sort: 'date' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

