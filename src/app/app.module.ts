import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { ZoomAreaComponent } from './cabinet-scene/zoom-area/zoom-area.component';
import { ZoomAreaDialogComponent } from './cabinet-scene/zoom-area-dialog/zoom-area-dialog.component';
import { RelicDotComponent } from './cabinet-scene/relic-dot/relic-dot.component';
import { RelicDialogComponent } from './cabinet-scene/relic-dialog/relic-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    CabinetSceneComponent,
    ZoomAreaComponent,
    ZoomAreaDialogComponent,
    RelicDotComponent,
    RelicDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
