import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomArea, User, RelicAndSaints } from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import {FirebaseDataService} from './firebase-data.service';
import {FirebaseAuthService} from './firebase-auth.service';

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
  };

  photos = new Map()
    .set(this.leftRightList[this.leftRightIndex], Object.assign({}, this.currentPhotoInfo));

  constructor(private firebaseDataService: FirebaseDataService,
              public firebaseAuthService: FirebaseAuthService,
              private angularFireAuth: AngularFireAuth) {
    // Initialize Cloud Firestore through Firebase
    firebaseAuthService.getInitialUserData();
    firebaseDataService.getInitialServerData(() => {
      this.redrawCurrentScene();
    });
  }

  login(): void {
    this.firebaseAuthService.login();
  }

  logout(): void {
    this.firebaseAuthService.logout();
  }

  moveLeftOrRight(direction: string): void {
    if (direction === 'left') {
      this.leftRightIndex--;
    } else {
      this.leftRightIndex++;
    }
    if (this.leftRightIndex >= this.leftRightList.length) {
      this.leftRightIndex = 0;
    } else if (this.leftRightIndex < 0) {
      this.leftRightIndex = this.leftRightList.length - 1;
    }
    this.changeCabinetScene(this.leftRightList[this.leftRightIndex]);
  }

  changeCabinetScene(photoToChangeTo: string): void {
    if (this.photos.has(photoToChangeTo)) {
      this.currentPhotoInfo = this.photos.get(photoToChangeTo);
    } else {
      this.currentPhotoInfo = {
        photoFilename: photoToChangeTo,
        photoImgPath: this.firebaseDataService.getPhotoForFilename(photoToChangeTo),
        relicsInPhoto: [],
        naturalImgWidth: 0, // will be replaced by load call of image
        naturalImgHeight: 0, // will be replaced by load call of image
      };
      // Add new photo area to the set of photos.
      this.photos.set(photoToChangeTo, this.currentPhotoInfo);
    }
    // Photo img change in cabinet scene will trigger sendRedrawInfo.

    console.log('changed cabinet scene to ', photoToChangeTo);
    console.log('currentCabinetScene', this.currentPhotoInfo,
    'photos', this.photos,
    'relics', this.firebaseDataService.allRelicsLocal);
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
}
