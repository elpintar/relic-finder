import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomArea, User, RelicAndSaints, PhotoArrows } from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import {FirebaseDataService} from './firebase-data.service';
import {FirebaseAuthService} from './firebase-auth.service';
import { ArrowDialogComponent } from './cabinet-scene/arrow-dialog/arrow-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  @ViewChild(CabinetSceneComponent)
  private cabinetSceneComponent?: CabinetSceneComponent;

  title = 'relic-finder';
  editMode = false;
  addRelicMode = true;
  hideLabels = false;
  movingRelicOrZA = '';
  helperText = '';

  zoomedList: string[] = [];
  leftRightList: string[] = ['MNOPQ.jpeg', 'GHJKL.jpeg', 'ABCDEF.jpeg',
                             'WXYZZaZb.jpeg', 'RSTUV.jpeg'];
  leftRightIndex = 0;

  currentPhotoInfo: PhotoInfo = {
    photoFilename: 'MNOPQ.jpeg',
    photoImgPath: 'https://firebasestorage.googleapis.com/v0/b/relic-finder.' +
                  'appspot.com/o/zas%2FMNOPQ_1600x1600.jpeg?alt=media',
    relicsInPhoto: [],
    naturalImgWidth: 0, // will be replaced by load call of image
    naturalImgHeight: 0, // will be replaced by load call of image
    arrows: {photoFilename: 'MNOPQ.jpeg'}, // will be replaced
  };

  photos = new Map();

  constructor(private firebaseDataService: FirebaseDataService,
              public firebaseAuthService: FirebaseAuthService,
              private dialog: MatDialog,
              private angularFireAuth: AngularFireAuth) {
    // Initialize Cloud Firestore through Firebase
    firebaseAuthService.getInitialUserData();
    firebaseDataService.getInitialServerData(() => {
      const startingArrows = this.firebaseDataService.getPhotoArrows(this.currentPhotoInfo.photoFilename);
      if (!startingArrows) {
        alert('Arrow data not properly loaded!');
      } else {
        this.currentPhotoInfo.arrows = startingArrows;
      }
      this.redrawCurrentScene();
    });
  }

  login(): void {
    this.firebaseAuthService.login();
  }

  logout(): void {
    this.firebaseAuthService.logout();
  }

  arrowClicked(direction: string): void {
    let newPhotoFilename: string|undefined;
    // Use existing arrow.
    if (direction === 'left') {
      newPhotoFilename = this.currentPhotoInfo.arrows.leftToPhoto;
    } else if (direction === 'right') {
      newPhotoFilename = this.currentPhotoInfo.arrows.rightToPhoto;
    } else if (direction === 'up') {
      newPhotoFilename = this.currentPhotoInfo.arrows.upToPhoto;
    } else { // down
      newPhotoFilename = this.currentPhotoInfo.arrows.downToPhoto;
    }
    if (!newPhotoFilename) {
      // Create new arrow.
      if (this.editMode) {
        this.openDialogForEditArrow(Object.assign({}, this.currentPhotoInfo.arrows))
        .subscribe((result) => {
          console.log('result', result);
          if (result) {
            // User pressed OK.
            if (direction === 'left') {
              this.currentPhotoInfo.arrows.leftToPhoto = result;
            } else if (direction === 'right') {
              this.currentPhotoInfo.arrows.rightToPhoto = result;
            } else if (direction === 'up') {
              this.currentPhotoInfo.arrows.upToPhoto = result;
            } else { // down
              this.currentPhotoInfo.arrows.downToPhoto = result;
            }
            const returnArrows = this.firebaseDataService
              .updatePhotoArrowsBothDirections(
                this.currentPhotoInfo.arrows, direction, result);
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
    if (this.photos.has(photoToChangeTo)) {
      this.currentPhotoInfo = this.photos.get(photoToChangeTo);
    } else {
      const emptyArrows = {
        photoFilename: photoToChangeTo,
      };
      this.currentPhotoInfo = {
        photoFilename: photoToChangeTo,
        photoImgPath: this.firebaseDataService.getPhotoForFilename(photoToChangeTo),
        relicsInPhoto: [],
        naturalImgWidth: 0, // will be replaced by load call of image
        naturalImgHeight: 0, // will be replaced by load call of image
        arrows: this.firebaseDataService.getPhotoArrows(photoToChangeTo) ||
                emptyArrows,
      };
      // Add new photo area to the set of photos.
      this.photos.set(photoToChangeTo, this.currentPhotoInfo);
    }
    // Photo img change in cabinet scene will trigger sendRedrawInfo.

    console.log('changed cabinet scene to ', photoToChangeTo);
    console.log('currentCabinetScene', this.currentPhotoInfo,
    'photos', this.photos);
  }

  redrawCurrentScene(): void {
    this.sendRedrawInfo(this.currentPhotoInfo.photoFilename);
  }

  sendRedrawInfo(photoToChangeTo: string): void {
    if (!this.cabinetSceneComponent) {
      throw new Error('No cabinet scene component!');
    }
    const relicsInPhoto = this.firebaseDataService.allRelicsLocal.filter(
      r => r.inPhoto === photoToChangeTo);
    const zasInPhoto = this.firebaseDataService.allZoomAreasLocal.filter(
      za => za.zoomFromPhotoFilename === photoToChangeTo);
    this.cabinetSceneComponent.redrawScene(relicsInPhoto, zasInPhoto);
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
    this.firebaseDataService.addOrUpdateRelicAndSaints(relicAndSaints);
  }

  toggleEditMode(): void {
    if (!this.editMode && !this.firebaseAuthService.userIsEditor) {
      alert('Your editing changes will not be saved, since your user account ' +
            'is not registered with our database. Reach out to ' +
            'elpintar@gmail.com for edit access. Send him this code: ' +
            (this.firebaseAuthService.user ?
              this.firebaseAuthService.user.uid : 'no id found'));
    }
    this.editMode = !this.editMode;
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

  showInfo() {
    this.openInfoDialog().subscribe(() => {
      console.log('closed dialog');
    });
  }

  private openInfoDialog(): Observable<void> {
    const dialogRef = this.dialog.open(InfoDialogComponent, {
      panelClass: 'info-dialog-panel'
    });
    return dialogRef.afterClosed();
  }
}
