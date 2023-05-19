import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutofillRelicsDialogComponent } from './autofill-relics-dialog.component';

describe('AutofillRelicsDialogComponent', () => {
  let component: AutofillRelicsDialogComponent;
  let fixture: ComponentFixture<AutofillRelicsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutofillRelicsDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutofillRelicsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
