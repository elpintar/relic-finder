import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {MatDialogModule} from '@angular/material/dialog';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { ZoomAreaComponent } from './cabinet-scene/zoom-area/zoom-area.component';
import { ZoomAreaDialogComponent } from './cabinet-scene/zoom-area-dialog/zoom-area-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    CabinetSceneComponent,
    ZoomAreaComponent,
    ZoomAreaDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
