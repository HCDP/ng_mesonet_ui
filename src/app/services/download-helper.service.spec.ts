import { TestBed } from '@angular/core/testing';

import { DownloadHelperService } from './download-helper.service';

describe('DownloadHelperService', () => {
  let service: DownloadHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
