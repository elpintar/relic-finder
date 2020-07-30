import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { ZoomAreaComponent } from './zoom-area/zoom-area.component';

@NgModule({
  declarations: [
    AppComponent,
    CabinetSceneComponent,
    ZoomAreaComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
