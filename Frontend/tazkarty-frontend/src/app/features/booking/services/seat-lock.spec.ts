import { TestBed } from '@angular/core/testing';

import { SeatLock } from './seat-lock';

describe('SeatLock', () => {
  let service: SeatLock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeatLock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
