import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { jwtCheckGuard } from './jwt-check.guard';

describe('jwtCheckGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => jwtCheckGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
