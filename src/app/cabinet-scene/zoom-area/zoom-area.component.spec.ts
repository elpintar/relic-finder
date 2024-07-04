import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ZoomAreaComponent } from './zoom-area.component';

describe('ZoomAreaComponent', () => {
  let component: ZoomAreaComponent;
  let fixture: ComponentFixture<ZoomAreaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ZoomAreaComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
