import { TestBed } from '@angular/core/testing';

import { ComedorService } from './comedor.service';

describe('ComedorService', () => {
  let service: ComedorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComedorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
