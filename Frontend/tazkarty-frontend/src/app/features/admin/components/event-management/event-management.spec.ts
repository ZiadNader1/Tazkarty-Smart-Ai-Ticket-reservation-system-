import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventManagement } from './event-management';

describe('EventManagement', () => {
  let component: EventManagement;
  let fixture: ComponentFixture<EventManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
