import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelicDotComponent } from './relic-dot.component';

describe('RelicDotComponent', () => {
  let component: RelicDotComponent;
  let fixture: ComponentFixture<RelicDotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RelicDotComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelicDotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
