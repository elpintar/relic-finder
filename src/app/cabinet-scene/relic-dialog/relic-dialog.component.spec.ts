import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RelicDialogComponent } from './relic-dialog.component';

describe('RelicDialogComponent', () => {
  let component: RelicDialogComponent;
  let fixture: ComponentFixture<RelicDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RelicDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelicDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
