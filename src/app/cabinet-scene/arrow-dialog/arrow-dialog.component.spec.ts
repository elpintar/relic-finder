import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ArrowDialogComponent } from './arrow-dialog.component';

describe('ArrowDialogComponent', () => {
  let component: ArrowDialogComponent;
  let fixture: ComponentFixture<ArrowDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ArrowDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArrowDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
