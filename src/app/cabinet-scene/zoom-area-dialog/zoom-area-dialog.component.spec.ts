import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ZoomAreaDialogComponent } from './zoom-area-dialog.component';

describe('ZoomAreaDialogComponent', () => {
  let component: ZoomAreaDialogComponent;
  let fixture: ComponentFixture<ZoomAreaDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [ZoomAreaDialogComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomAreaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
