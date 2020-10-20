import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomArea, User } from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

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

  user: firebase.User|null = null;
  users: User[]|null = null;
  userIsEditor = false;

  zoomedList: string[] = [];
  leftRightList: string[] = ['ZeZf', 'ZaZb', 'WXYZ', 'TUV',
    'S', 'MNOPQ', 'M', 'K',
    'GHJ', 'CDEF', 'B', 'A', 'ZgZcZh'];
  leftRightIndex = 5;

  currentPhotoInfo: PhotoInfo = {
    photoIdName: 'MNOPQ',
    photoImgPath: 'assets/pics/MNOPQ.jpg',
    relicsInPhoto: [],
    naturalImgWidth: 0, // will be replaced by load call of image
    naturalImgHeight: 0, // will be replaced by load call of image
  };

  photos = new Map()
    .set(this.leftRightList[this.leftRightIndex], Object.assign({}, this.currentPhotoInfo));

  relics: Relic[] = [];
  zoomAreas: ZoomArea[] = [];

  constructor(private firestore: AngularFirestore,
              public angularFireAuth: AngularFireAuth) {
    // Initialize Cloud Firestore through Firebase
    this.getInitialUserData();
    this.getInitialServerData();
    angularFireAuth.authState.subscribe((user: firebase.User|null) => {
      // Update user data whenever the auth state changes.
      this.user = user;
      this.checkIfUserIsEditor();
    });
  }

  getInitialUserData(): void {
    // Get user data if user is logged in.
    this.angularFireAuth.user.pipe(take(1)).subscribe(userResult => {
      console.log('user:', userResult);
      this.user = userResult;
      // Get set of authentic user ids who can write.
      this.firestore.collection<User>('users')
          .valueChanges().pipe(take(1)).subscribe((users) => {
        console.log('users:', users);
        this.users = users;
        this.checkIfUserIsEditor();
      });
    });
  }

  getInitialServerData(): void {
    this.firestore.collection('relics')
        .valueChanges({idField: 'firebaseDocId'}).pipe(take(1)).subscribe((relicsList) => {
      this.relics = relicsList as Relic[];
      console.log('relics', this.relics);
      this.firestore.collection('zoomAreas')
          .valueChanges({idField: 'firebaseDocId'}).pipe(take(1)).subscribe((zoomAreasList) => {
        this.zoomAreas = zoomAreasList as ZoomArea[];
        console.log('zoomAreas', this.zoomAreas);
        this.redrawCurrentScene();
      });
    });
  }

  checkIfUserIsEditor(): void {
    const editorUsers = this.users;
    const loggedInUser = this.user;
    if (loggedInUser && editorUsers) {
      this.userIsEditor = editorUsers.findIndex(user => user.uid === loggedInUser.uid) >= 0;
      console.log('User is editor:', this.userIsEditor);
    }
  }

  login(): void {
    this.angularFireAuth.signInWithPopup(new auth.GoogleAuthProvider())
    .then((result) => {
      console.log('Logged in with user data:', JSON.stringify(result));
    }).catch((error: Error) => {
      alert('Login error: ' + error.message);
    });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.angularFireAuth.signOut();
    }
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
        photoIdName: photoToChangeTo,
        photoImgPath: 'assets/pics/' + photoToChangeTo + '.jpg',
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
    'relics', this.relics);
  }

  redrawCurrentScene(): void {
    this.sendRedrawInfo(this.currentPhotoInfo.photoIdName);
  }

  sendRedrawInfo(photoToChangeTo: string): void {
    if (!this.cabinetSceneComponent) {
      throw new Error('No cabinet scene component!');
    }
    const relicsInPhoto = this.relics.filter(r => r.inPhoto === photoToChangeTo);
    const zasInPhoto = this.zoomAreas.filter(za => za.zoomFromPhotoId === photoToChangeTo);
    this.cabinetSceneComponent.redrawScene(relicsInPhoto, zasInPhoto);
  }

  zoomIn(photoToChangeTo: string): void {
    this.zoomedList.unshift(this.currentPhotoInfo.photoIdName);
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
    console.log('new zoom area info', zoomArea);
    const zoomAreaCollection = this.firestore.collection<ZoomArea>('zoomAreas');
    zoomAreaCollection.add(zoomArea).catch((reason: string) => {
      throw Error(reason);
    }).finally(() => {
      console.log('successfully added zoomArea: ', zoomArea);
    });
  }

  // WRITE new relic.
  addOrUpdateRelicDot(relic: Relic): void {
    console.log('add or update:', relic);
    if (relic && relic.saints && relic.saints[0] && relic.saints[0].name) {
      this.firestore.collection('relics',
          ref => ref.where('saint.name', '==', relic.saints[0] ? relic.saints[0].name : ''))
          .get().pipe(take(1)).subscribe((relics: QuerySnapshot<DocumentData>) => {
        if (relics.size > 1) {
          alert('Error: two relics found with same data: ' + JSON.stringify(relic));
        } else if (relics.size === 1) {
          this.updateRelic(relics, relic);
        } else {
          this.addRelic(relic);
        }
      });
    }
  }

  updateRelic(querySnapshot: QuerySnapshot<DocumentData>, relic: Relic): void {
    querySnapshot.forEach(doc => {
      // There will only be one doc.
      this.firestore.collection<Relic>('relics').doc(doc.id).update(relic)
      .then(() => {
        console.log('Relic updated:', doc.id, relic);
      })
      .catch((error) => {
        console.error('Error updating document: ', error);
      });
    });
  }

  addRelic(relic: Relic): void {
    this.firestore.collection<Relic>('relics').add(relic)
      .then((documentReference: DocumentReference) => {
        console.log('document reference:', documentReference);
      })
      .catch((reason: string) => {
        console.error(reason);
        alert('Reminder: your data is not being saved.');
      }).finally(() => {
        console.log('successfully added relic: ', relic);
      });
  }

  toggleEditMode(): void {
    if (!this.editMode && !this.userIsEditor) {
      alert('Your editing changes will not be saved, since your user account ' +
            'is not registered with our database. Reach out to ' +
            'elpintar@gmail.com for edit access. Send him this code: ' +
            (this.user ? this.user.uid : 'no id found'));
    }
    this.editMode = !this.editMode;
  }

  toggleAddRelicMode(): void {
    this.addRelicMode = !this.addRelicMode;
  }

  toggleHideLabels(): void {
    this.hideLabels = !this.hideLabels;
  }
}
