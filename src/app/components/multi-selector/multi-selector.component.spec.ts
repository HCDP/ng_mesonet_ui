import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectorComponent } from './multi-selector.component';

describe('MultiSelectorComponent', () => {
  let component: MultiSelectorComponent;
  let fixture: ComponentFixture<MultiSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
