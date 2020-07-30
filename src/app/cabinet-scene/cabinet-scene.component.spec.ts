import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CabinetSceneComponent } from './cabinet-scene.component';

describe('CabinetSceneComponent', () => {
  let component: CabinetSceneComponent;
  let fixture: ComponentFixture<CabinetSceneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CabinetSceneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CabinetSceneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
