import { TestBed } from '@angular/core/testing';

import { DataPackagerService } from './data-packager.service';

describe('DataPackagerService', () => {
  let service: DataPackagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataPackagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
