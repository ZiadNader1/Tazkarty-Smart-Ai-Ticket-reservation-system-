import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueManagement } from './venue-management';

describe('VenueManagement', () => {
  let component: VenueManagement;
  let fixture: ComponentFixture<VenueManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VenueManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
