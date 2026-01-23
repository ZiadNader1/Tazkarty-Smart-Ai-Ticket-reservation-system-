import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingShows } from './upcoming-shows';

describe('UpcomingShows', () => {
  let component: UpcomingShows;
  let fixture: ComponentFixture<UpcomingShows>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingShows]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingShows);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
