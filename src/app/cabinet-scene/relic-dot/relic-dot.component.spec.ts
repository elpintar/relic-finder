import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RelicDotComponent } from './relic-dot.component';

describe('RelicDotComponent', () => {
  let component: RelicDotComponent;
  let fixture: ComponentFixture<RelicDotComponent>;

  beforeEach(waitForAsync(() => {
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
