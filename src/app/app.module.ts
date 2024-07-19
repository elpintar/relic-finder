import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { ZoomAreaComponent } from './cabinet-scene/zoom-area/zoom-area.component';
import { ZoomAreaDialogComponent } from './cabinet-scene/zoom-area-dialog/zoom-area-dialog.component';
import { RelicDotComponent } from './cabinet-scene/relic-dot/relic-dot.component';
import { RelicDialogComponent } from './cabinet-scene/relic-dialog/relic-dialog.component';
import { ArrowDialogComponent } from './cabinet-scene/arrow-dialog/arrow-dialog.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { AutofillRelicsDialogComponent } from './autofill-relics-dialog/autofill-relics-dialog.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseDataService } from './firebase-data.service';

@NgModule({
  declarations: [
    AppComponent,
    CabinetSceneComponent,
    ZoomAreaComponent,
    ZoomAreaDialogComponent,
    RelicDotComponent,
    RelicDialogComponent,
    ArrowDialogComponent,
    InfoDialogComponent,
    AutofillRelicsDialogComponent,
    SearchBarComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatExpansionModule,
    ReactiveFormsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ],
  providers: [FirebaseAuthService, FirebaseDataService],
  bootstrap: [AppComponent],
})
export class AppModule {}
