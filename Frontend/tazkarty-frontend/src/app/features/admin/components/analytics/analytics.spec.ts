// =====================================================
// FILE: src/app/features/admin/components/analytics/analytics.spec.ts
// Analytics Component Unit Tests
// =====================================================

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Analytics } from './analytics';

describe('Analytics Component', () => {
  let component: Analytics;
  let fixture: ComponentFixture<Analytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Analytics]
    }).compileComponents();

    fixture = TestBed.createComponent(Analytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default period as month', () => {
    expect(component.selectedPeriod()).toBe('month');
  });

  it('should load analytics data on init', () => {
    component.ngOnInit();
    expect(component.revenueData().length).toBeGreaterThan(0);
  });

  it('should change period when selected', () => {
    component.selectPeriod('week');
    expect(component.selectedPeriod()).toBe('week');
    
    component.selectPeriod('year');
    expect(component.selectedPeriod()).toBe('year');
  });

  it('should calculate max revenue correctly', () => {
    const maxRevenue = component.getMaxRevenue();
    expect(maxRevenue).toBeGreaterThan(0);
  });

  it('should calculate bar height as percentage', () => {
    const revenue = 50000;
    const height = component.getBarHeight(revenue);
    expect(height).toBeGreaterThanOrEqual(0);
    expect(height).toBeLessThanOrEqual(100);
  });

  it('should have summary stats', () => {
    expect(component.totalRevenue()).toBeGreaterThan(0);
    expect(component.totalBookings()).toBeGreaterThan(0);
    expect(component.averageTicketPrice()).toBeGreaterThan(0);
    expect(component.conversionRate()).toBeGreaterThan(0);
  });

  it('should have top events data', () => {
    expect(component.topEvents().length).toBeGreaterThan(0);
    const firstEvent = component.topEvents()[0];
    expect(firstEvent).toHaveProperty('name');
    expect(firstEvent).toHaveProperty('bookings');
    expect(firstEvent).toHaveProperty('revenue');
    expect(firstEvent).toHaveProperty('category');
  });

  it('should have category breakdown', () => {
    expect(component.categoryBreakdown().length).toBeGreaterThan(0);
    const firstCategory = component.categoryBreakdown()[0];
    expect(firstCategory).toHaveProperty('category');
    expect(firstCategory).toHaveProperty('count');
    expect(firstCategory).toHaveProperty('percentage');
    expect(firstCategory).toHaveProperty('color');
  });

  it('should have 12 months of revenue data', () => {
    expect(component.revenueData().length).toBe(12);
  });

  it('should call exportData method', () => {
    spyOn(window, 'alert');
    component.exportData();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should call downloadReport method', () => {
    spyOn(window, 'alert');
    component.downloadReport();
    expect(window.alert).toHaveBeenCalled();
  });
});