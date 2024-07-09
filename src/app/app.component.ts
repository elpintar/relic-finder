import { Component, ViewChild } from '@angular/core';
import {
  PhotoInfo,
  Relic,
  ZoomArea,
  User,
  RelicAndSaints,
  PhotoArrows,
  SpreadsheetRow,
  Saint,
  DisplayZoomArea,
} from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { FirebaseDataService } from './firebase-data.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { FileDataService } from './file-data.service';
import { ArrowDialogComponent } from './cabinet-scene/arrow-dialog/arrow-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import { AutofillRelicsDialogComponent } from './autofill-relics-dialog/autofill-relics-dialog.component';
import { makeSaintNameString } from './helperFuncs';
import { Auth as AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent {
  @ViewChild(CabinetSceneComponent)
  private cabinetSceneComponent?: CabinetSceneComponent;

  title = 'relic-finder';
  editMode = false;
  addRelicMode = true;
  hideLabels = false;
  movingRelicOrZA = '';
  autofillingRelics = '';
  autofillRow?: SpreadsheetRow;
  helperText = '';

  zoomedList: string[] = [];
  zoomAreaRelicCounts: Map<string, number>;
  // For relic search.
  zoomAreasToColor: Map<string, string>;
  zoomAreaSearchRelicCounts: Map<string, number>;
  arrowCounts: Map<string, number>;
  zoomOutCount: number;

  currentPhotoInfo: PhotoInfo = {
    photoFilename: 'MNOPQ.jpeg',
    photoImgPath:
      'https://firebasestorage.googleapis.com/v0/b/relic-finder.' +
      'appspot.com/o/zas%2FMNOPQ_1600x1600.jpeg?alt=media',
    relicsInPhoto: [],
    naturalImgWidth: 0, // will be replaced by load call of image
    naturalImgHeight: 0, // will be replaced by load call of image
    arrows: { photoFilename: 'MNOPQ.jpeg' }, // will be replaced
  };

  photos = new Map();

  constructor(
    private firebaseDataService: FirebaseDataService,
    public firebaseAuthService: FirebaseAuthService,
    private fileDataService: FileDataService,
    private dialog: MatDialog,
    private angularFireAuth: AngularFireAuth,
  ) {
    this.zoomAreaRelicCounts = new Map();
    this.zoomAreasToColor = new Map();
    this.zoomAreaSearchRelicCounts = new Map();
    this.arrowCounts = new Map();
    this.zoomOutCount = 0;
    // Initialize Cloud Firestore through Firebase
    firebaseAuthService.getInitialUserData();
    firebaseDataService.getInitialServerData(() => {
      const startingArrows = this.firebaseDataService.getPhotoArrows(
        this.currentPhotoInfo.photoFilename
      );
      if (!startingArrows) {
        alert('Arrow data not properly loaded!');
      } else {
        this.currentPhotoInfo.arrows = startingArrows;
      }
      this.redrawCurrentScene();
      this.fileDataService.fetchCsvData(() => {
        console.log('Got csv relic data.');
      });
    });
  }

  login(): void {
    this.firebaseAuthService.login();
  }

  logout(): void {
    this.firebaseAuthService.logout();
  }

  arrowClicked(direction: string): void {
    let newPhotoFilename: string | undefined;
    // Use existing arrow.
    if (direction === 'left') {
      newPhotoFilename = this.currentPhotoInfo.arrows.leftToPhoto;
    } else if (direction === 'right') {
      newPhotoFilename = this.currentPhotoInfo.arrows.rightToPhoto;
    } else if (direction === 'up') {
      newPhotoFilename = this.currentPhotoInfo.arrows.upToPhoto;
    } else {
      // down
      newPhotoFilename = this.currentPhotoInfo.arrows.downToPhoto;
    }
    if (!newPhotoFilename) {
      // Create new arrow.
      if (this.editMode) {
        this.openDialogForEditArrow(
          Object.assign({}, this.currentPhotoInfo.arrows)
        ).subscribe((result) => {
          console.log('result', result);
          if (result) {
            // User pressed OK.
            if (direction === 'left') {
              this.currentPhotoInfo.arrows.leftToPhoto = result;
            } else if (direction === 'right') {
              this.currentPhotoInfo.arrows.rightToPhoto = result;
            } else if (direction === 'up') {
              this.currentPhotoInfo.arrows.upToPhoto = result;
            } else {
              // down
              this.currentPhotoInfo.arrows.downToPhoto = result;
            }
            const returnArrows =
              this.firebaseDataService.updatePhotoArrowsBothDirections(
                this.currentPhotoInfo.arrows,
                direction,
                result
              );
            // Update local data for return arrow photoInfo if changed.
            if (returnArrows && this.photos.has(returnArrows.photoFilename)) {
              const thatPhotoInfo = this.photos.get(returnArrows.photoFilename);
              thatPhotoInfo.arrows = returnArrows;
              this.photos.set(returnArrows.photoFilename, thatPhotoInfo);
            }
          }
        });
      } else {
        alert('Photo does not exist for direction: ' + direction);
      }
    } else {
      // Go to new scene using existing arrow.
      this.changeCabinetScene(newPhotoFilename);
    }
  }

  changeCabinetScene(photoToChangeTo: string): void {
    // Reset display data.
    this.zoomAreasToColor = new Map();
    this.arrowCounts = new Map();
    this.zoomOutCount = 0;
    if (this.photos.has(photoToChangeTo)) {
      this.currentPhotoInfo = this.photos.get(photoToChangeTo);
    } else {
      // Reset currentPhotoInfo.
      const emptyArrows = {
        photoFilename: photoToChangeTo,
      };
      this.currentPhotoInfo = {
        photoFilename: photoToChangeTo,
        photoImgPath:
          this.firebaseDataService.getPhotoForFilename(photoToChangeTo),
        relicsInPhoto: [],
        naturalImgWidth: 0, // will be replaced by load call of image
        naturalImgHeight: 0, // will be replaced by load call of image
        arrows:
          this.firebaseDataService.getPhotoArrows(photoToChangeTo) ||
          emptyArrows,
      };
      // Add new photo area to the set of photos.
      this.photos.set(photoToChangeTo, this.currentPhotoInfo);
    }
    // Photo img change in cabinet scene will trigger sendRedrawInfo.

    console.log('changed cabinet scene to ', photoToChangeTo);
    console.log(
      'currentCabinetScene',
      this.currentPhotoInfo,
      'photos',
      this.photos
    );
  }

  redrawCurrentScene(): void {
    this.sendRedrawInfo(this.currentPhotoInfo.photoFilename);

    if (this.editMode) {
      // Show chapel location & photo file name.
      const photoName = this.currentPhotoInfo.photoFilename;
      const jpgIndex = photoName.indexOf('.jp');
      let shortPhotoName = photoName.slice(0, jpgIndex);
      const slashIndex = shortPhotoName.indexOf('%2F');
      if (slashIndex >= 0) {
        shortPhotoName = shortPhotoName.substring(slashIndex + 3);
      }
      this.setHelperText(photoName + ' [ ' + shortPhotoName + ' ]');
    }
  }

  sendRedrawInfo(photoToChangeTo: string): void {
    if (!this.cabinetSceneComponent) {
      throw new Error('No cabinet scene component!');
    }
    const relicsInPhoto = this.firebaseDataService.allRelicsLocal.filter(
      (r) => r.inPhoto === photoToChangeTo
    );
    const zasInPhoto = this.firebaseDataService.allZoomAreasLocal.filter(
      (za) => za.zoomFromPhotoFilename === photoToChangeTo
    );
    const displayZAsInPhoto: DisplayZoomArea[] = zasInPhoto.map((za) => {
      const zaKey = za.firebaseDocId || '';
      return {
          ...za,
          color: this.zoomAreasToColor.get(zaKey) || 'yellow',
          searchRelicCount: this.zoomAreaSearchRelicCounts.get(zaKey) || 0,
        };
    });
    if (this.editMode) {
      this.getRelicCounts(photoToChangeTo);
    }
    this.cabinetSceneComponent.redrawScene(
      relicsInPhoto,
      displayZAsInPhoto,
      this.zoomAreaRelicCounts
    );
  }

  zoomIn(photoToChangeTo: string): void {
    this.zoomedList.unshift(this.currentPhotoInfo.photoFilename);
    this.changeCabinetScene(photoToChangeTo);
  }

  zoomOut(): void {
    const zoomToPic = this.zoomedList.shift();
    if (!zoomToPic) {
      throw new Error('No picture to zoom out from!');
    }
    this.changeCabinetScene(zoomToPic);
  }

  // WRITE new zoom area (but doesn't change view).
  // Called after adding a new zoom area, before zooming into it.
  addZoomArea(zoomArea: ZoomArea): void {
    this.firebaseDataService.createZoomArea(zoomArea);
  }

  // WRITE new relic.
  addOrUpdateRelicDot(relicAndSaints: RelicAndSaints): void {
    this.firebaseDataService.addOrUpdateRelicAndSaints(relicAndSaints, () => {
      // Successful write of new relic - prompt next autofill.
      if (this.autofillingRelics && this.autofillRow && this.autofillRow.i) {
        const nextI = this.autofillRow.i + 1;
        this.autofillRow = this.fileDataService.cleanSpreadsheetData[nextI];
        this.openAutofillRelicsDialog(this.autofillRow).subscribe(
          this.afterAutofillDialogClosed.bind(this)
        );
      }
    });
  }

  toggleEditMode(): void {
    if (!this.editMode && !this.firebaseAuthService.userIsEditor) {
      alert(
        'Your editing changes will not be saved, since your user account ' +
          'is not registered with our database. Reach out to ' +
          'elpintar@gmail.com for edit access. Send him this code: ' +
          (this.firebaseAuthService.user
            ? this.firebaseAuthService.user.uid
            : 'no id found')
      );
    }
    this.editMode = !this.editMode;
    // Without this, editMode won't be updated in cabinet scene in time to
    // draw the relic counts properly.
    if (this.cabinetSceneComponent) {
      this.cabinetSceneComponent.editMode = this.editMode;
    }
    this.setHelperText('');
    // Redraw current scene to add / get rid of edit mode specific things,
    // like relic counts.
    this.redrawCurrentScene();
  }

  toggleAddRelicMode(): void {
    this.addRelicMode = !this.addRelicMode;
  }

  toggleHideLabels(): void {
    this.hideLabels = !this.hideLabels;
  }

  openDialogForEditArrow(arrows: PhotoArrows): Observable<string> {
    const dialogRef = this.dialog.open(ArrowDialogComponent, {
      data: arrows,
    });

    return dialogRef.afterClosed();
  }

  setHelperText(newText?: string): void {
    if (newText) {
      this.helperText = newText;
    } else {
      this.helperText = '';
    }
  }

  setHelperTextFromCabinetScene(newText: string): void {
    this.setHelperText(newText);
  }

  moveRelicOrZA(): void {
    if (this.movingRelicOrZA) {
      this.movingRelicOrZA = '';
      this.helperText = '';
    } else {
      this.movingRelicOrZA = 'whichRelicOrZA';
      this.helperText = 'Click relic or zoom area to move';
    }
  }

  autofillRelicsToggle(): void {
    if (this.autofillingRelics) {
      this.clearAutofill();
    } else {
      this.openAutofillRelicsDialog().subscribe(
        this.afterAutofillDialogClosed.bind(this)
      );
    }
  }

  private openAutofillRelicsDialog(rowToAutofill?: SpreadsheetRow) {
    const dialogRef = this.dialog.open(AutofillRelicsDialogComponent, {
      data: rowToAutofill,
    });
    return dialogRef.afterClosed();
  }

  private afterAutofillDialogClosed(rowToPlace: SpreadsheetRow) {
    if (rowToPlace) {
      this.autofillingRelics = 'whereRelicForLocation';
      this.autofillRow = rowToPlace;
      this.setHelperText('Click where relic should go.');
      this.addRelicMode = true;
    } else {
      this.clearAutofill();
    }
  }

  private clearAutofill(): void {
    this.autofillingRelics = '';
    this.autofillRow = undefined;
    this.setHelperText();
  }

  showInfo() {
    this.openInfoDialog().subscribe(() => {
      console.log('closed dialog');
    });
  }

  private openInfoDialog(): Observable<void> {
    const dialogRef = this.dialog.open(InfoDialogComponent, {
      panelClass: 'info-dialog-panel',
    });
    return dialogRef.afterClosed();
  }

  recursivelyGetRelicCounts(startingPhoto: string): number {
    const existingCount = this.zoomAreaRelicCounts.get(startingPhoto);
    if (existingCount) {
      // This will only update these counts once per page refresh, which is ok.
      return existingCount;
    }

    let relicCount = 0;

    // Get count of relics in this view.
    const relicsInPhoto = this.firebaseDataService.allRelicsLocal.filter(
      (r) => r.inPhoto === startingPhoto
    );
    relicCount += relicsInPhoto.length;

    // Recursively get counts for each photo you can zoom to from here.
    const zasInPhoto = this.firebaseDataService.allZoomAreasLocal.filter(
      (za) => za.zoomFromPhotoFilename === startingPhoto
    );
    zasInPhoto.forEach((za) => {
      relicCount += this.recursivelyGetRelicCounts(za.zoomToPhotoFilename);
    });

    // Update data structure.
    this.zoomAreaRelicCounts.set(startingPhoto, relicCount);

    return relicCount;
  }

  getRelicCounts(startingPhoto: string): void {
    this.recursivelyGetRelicCounts(startingPhoto);
  }

  addOneToArrowCount(arrowString: string) {
    const count = this.arrowCounts.get(arrowString);
    if (count) {
      this.arrowCounts.set(arrowString, count + 1);
    } else {
      this.arrowCounts.set(arrowString, 1);
    }
  }

  addArrowCountIfNextStepFound(nextStep: string): boolean {
    const arrows = this.currentPhotoInfo.arrows;
    let foundNextStep = true; // Assume true unless nothing found below.
    if (arrows.leftToPhoto === nextStep) {
      this.addOneToArrowCount('left');
    } else if (arrows.rightToPhoto === nextStep) {
      this.addOneToArrowCount('right');
    } else if (arrows.upToPhoto === nextStep) {
      this.addOneToArrowCount('up');
    } else if (arrows.downToPhoto === nextStep) {
      this.addOneToArrowCount('down');
    } else {
      foundNextStep = false;
    }
    return foundNextStep;
  }

  addOneToSearchRelicCount(zaId: string): void {
    const count = this.zoomAreaSearchRelicCounts.get(zaId);
    if (count) {
      this.zoomAreaSearchRelicCounts.set(zaId, count+1);
    } else {
      this.zoomAreaSearchRelicCounts.set(zaId, 1);
    }
  }

  highlightNextStep(nextStep: string): void {
    const zaToNextStep = this.firebaseDataService.allZoomAreasLocal.find(
      (za) =>
        za.zoomFromPhotoFilename === this.currentPhotoInfo.photoFilename &&
        za.zoomToPhotoFilename === nextStep
    );
    const addedToArrowCount = this.addArrowCountIfNextStepFound(nextStep);
    if (zaToNextStep && zaToNextStep.firebaseDocId) {
      const zaId = zaToNextStep.firebaseDocId;
      this.zoomAreasToColor.set(zaId, 'blue');
      this.addOneToSearchRelicCount(zaId);
    } else if (!addedToArrowCount) {
      // Need to zoom out to get to relic, since you can't get there thru a
      // ZoomArea or arrow.
      this.zoomOutCount++;
    }
  }

  highlightRelicPaths(relicPaths: string[][]): void {
    relicPaths.forEach((path) => {
      if (path.length === 0) {
        console.log('a relic is in current view');
      // TODO - higlight relic itself!
      return;
      }
      const nextStep = path[0];
      this.highlightNextStep(nextStep);
    });
  }

  makeNewSearch(saint: Saint): void {
    const relicsWithSaint = this.firebaseDataService.getRelicsForSaint(saint);
    const relicPaths = relicsWithSaint.map((r) => {
      return this.firebaseDataService.getPathToRelic(
        r,
        this.currentPhotoInfo.photoFilename
      );
    });
    console.log(relicPaths);
    const numRelics = relicsWithSaint.length;
    const saintName = makeSaintNameString(saint);
    this.setHelperText(numRelics + ' result(s) for ' + saintName);
    this.highlightRelicPaths(relicPaths);
    console.log(this.arrowCounts, this.zoomOutCount);
    this.redrawCurrentScene();
  }
}
