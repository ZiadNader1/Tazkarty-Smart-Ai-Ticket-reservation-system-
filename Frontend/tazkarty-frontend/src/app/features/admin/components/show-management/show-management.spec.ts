import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowManagement } from './show-management';

describe('ShowManagement', () => {
  let component: ShowManagement;
  let fixture: ComponentFixture<ShowManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
