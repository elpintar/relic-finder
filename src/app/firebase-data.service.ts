import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomArea, User, Saint, RelicAndSaints, CanonizationStatus } from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { bindCallback, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {

  allRelicsLocal: Relic[] = [];
  allZoomAreasLocal: ZoomArea[] = [];
  allSaintsLocal: Saint[] = [];

  constructor(private firestore: AngularFirestore) { }

  getInitialServerData(callback: () => void): void {
    this.firestore.collection('relics')
        .valueChanges({idField: 'firebaseDocId'}).pipe(take(1)).subscribe((relicsList) => {
      console.log('relics', relicsList);
      this.firestore.collection('zoomAreas')
          .valueChanges({idField: 'firebaseDocId'}).pipe(take(1)).subscribe((zoomAreasList) => {
        console.log('zoomAreas', zoomAreasList);
        this.firestore.collection('saints')
            .valueChanges({idField: 'firebaseDocId'}).pipe(take(1)).subscribe((saintsList) => {
          console.log('saints', saintsList);
          this.allRelicsLocal = relicsList as Relic[];
          this.allZoomAreasLocal = zoomAreasList as ZoomArea[];
          this.allSaintsLocal = saintsList as Saint[];
          callback();
        });
      });
    });
  }

  createZoomArea(zoomArea: ZoomArea): void {
    console.log('new zoom area info', zoomArea);
    const zoomAreaCollection = this.firestore.collection<ZoomArea>('zoomAreas');
    zoomAreaCollection.add(zoomArea).catch((reason: string) => {
      throw Error(reason);
    }).finally(() => {
      console.log('successfully added zoomArea: ', zoomArea);
    });
  }

  addOrUpdateRelicAndSaints(relicAndSaints: RelicAndSaints): void {
    console.log('add or update:', relicAndSaints);
    const relic = relicAndSaints[0];
    const saints = relicAndSaints[1];
    // Validate there is at least a saint name.
    if (relic && saints && saints[0] && saints[0].name) {
      if (!relic.firebaseDocId) {
        // ADD new relic/saints
        this.updateOrAddSaints(saints);
        this.addRelic(relic, saints);
      } else {
        // UPDATE relic/saints
        this.updateOrAddSaints(saints);
        this.updateRelic(relic, saints);
      }
    } else {
      alert('No saint name given; no data saved.');
    }
  }

  updateRelic(relic: Relic, saints: Saint[]): void {
    if (!relic.firebaseDocId) {
      alert('No relic firebaseDocId for ' + JSON.stringify(relic));
      return;
    }
    this.updateSaintIdsInRelic(relic, saints);
    this.firestore.collection<Relic>('relics').doc(relic.firebaseDocId)
      .update(relic)
      .then(() => {
        console.log('Relic updated:', relic.firebaseDocId, relic);
      })
      .catch((error) => {
        console.error('Error updating document: ', error);
      });
    // Update local data.
    const indexMatch = this.getLocalRelicIndexWithId(relic.firebaseDocId);
    if (indexMatch >= 0) {
      this.allRelicsLocal[indexMatch] = relic;
    } else {
      alert('No matching relic found to update locally!');
    }
  }

  updateOrAddSaints(saints: Saint[]): void {
    saints.forEach((saint) => {
      if (!saint.firebaseDocId) {
        // NEW TO ADD
        const newSaintId = this.makeIdForSaint(saint);
        saint.firebaseDocId = newSaintId;
        console.log('NEW SAINT ID: ', newSaintId);
        // Add to Firebase
        this.firestore.collection<Saint>('saints')
          .doc(newSaintId)
          .set(saint);
        // Add locally
        this.allSaintsLocal.push(saint);
      } else {
        const indexMatch = this.getLocalSaintIndexWithId(saint.firebaseDocId);
        if (indexMatch >= 0) {
          // UPDATE Firebase
          this.firestore.collection<Saint>('saints')
            .doc(saint.firebaseDocId)
            .set(saint);
          // Update locally
          this.allSaintsLocal[indexMatch] = saint;
        } else {
          alert('Data will not be saved for this saint - ' +
          'no firebase doc id match: ' + saint.firebaseDocId);
        }
      }
    });
  }

  addRelic(relic: Relic, saints: Saint[]): void {
    this.updateSaintIdsInRelic(relic, saints);
    const newRelicId = this.makeIdForRelic(relic, saints);
    relic.firebaseDocId = newRelicId;
    console.log('NEW RELIC ID: ', newRelicId);
    this.firestore.collection<Relic>('relics').doc(newRelicId).set(relic)
      .then(() => {
        console.log('successful write of new doc - firebase id: ' + newRelicId);
      })
      .catch((reason: string) => {
        console.error(reason);
        alert('Reminder: your data is not being saved.');
      }).finally(() => {
        console.log('successfully added relic: ', relic);
      });
    // Update local data
    this.allRelicsLocal.push(relic);
  }

  updateSaintIdsInRelic(relic: Relic, saints: Saint[]): void {
    relic.saintFirebaseDocIds = saints.map(s => {
      if (!s.firebaseDocId) {
        alert('Aborting; missing firebase doc id for saint ' + JSON.stringify(s));
        throw new Error('No saint id ' + JSON.stringify(s));
      }
      return s.firebaseDocId;
    });
  }

  getLatestRelicAndSaints(relicAndSaints: RelicAndSaints): RelicAndSaints {
    let updatedRelic = relicAndSaints[0];
    const saints = relicAndSaints[1];
    const updatedSaints: Saint[] = [];
    if (updatedRelic.firebaseDocId) {
      const relicIndex = this.getLocalRelicIndexWithId(updatedRelic.firebaseDocId);
      updatedRelic = this.allRelicsLocal[relicIndex];
    }
    saints.forEach(s => {
      let saintToAdd = s;
      if (s.firebaseDocId) {
        const sIndex = this.getLocalSaintIndexWithId(s.firebaseDocId);
        saintToAdd = this.allSaintsLocal[sIndex];
      }
      updatedSaints.push(saintToAdd);
    });
    return [updatedRelic, updatedSaints];
  }

  getSaintsForRelic(relic: Relic): Saint[] {
    const saints: Saint[] = [];
    relic.saintFirebaseDocIds.forEach(saintFirebaseId => {
      const saintIndex = this.getLocalSaintIndexWithId(saintFirebaseId);
      saints.push(this.allSaintsLocal[saintIndex]);
    });
    return saints;
  }

  // Filename format: 'MNOPQ.jpeg'
  getPhotoForFilename(filename: string): string {
    const filenameParts = filename.split('.');
    if (filenameParts.length !== 2) {
      console.error('Filename is invalid for photo: ', filename);
      return '';
    }
    const name = filenameParts[0];
    const filetype = filenameParts[1];
    const fullPath = 'https://firebasestorage.googleapis.com/v0/b/' +
    'relic-finder.appspot.com/o/zas%2F' +
    `${name}_1600x1600.${filetype}?alt=media`;
    return fullPath;
  }

  getLocalSaintIndexWithId(saintFirebaseId: string): number {
    return this.allSaintsLocal.findIndex((saint) => {
      return saint.firebaseDocId === saintFirebaseId;
    });
  }

  getLocalRelicIndexWithId(relicFirebaseId: string): number {
    return this.allRelicsLocal.findIndex((relic) => {
      return relic.firebaseDocId === relicFirebaseId;
    });
  }

  makeIdForSaint(saint: Saint): string {
    let newSaintId = '';
    switch (saint.canonizationStatus) {
      case CanonizationStatus.Saint:
        newSaintId = newSaintId + 'St_';
        break;
      case CanonizationStatus.Blessed:
        newSaintId = newSaintId + 'Bl_';
        break;
      case CanonizationStatus.Venerable:
        newSaintId = newSaintId + 'Ven_';
        break;
      case CanonizationStatus.ServantOfGod:
        newSaintId = newSaintId + 'SoG_';
        break;
      default:
        newSaintId = newSaintId + 'St?_';
    }
    newSaintId = newSaintId + saint.name.replace(' ', '_');
    if (saint.subtitle) {
      newSaintId = newSaintId + '_' + saint.subtitle.replace(' ', '_');
    } else if (saint.city) {
      newSaintId = newSaintId + '_of_' + saint.city.replace(' ', '_');
    }
    let matchingSaintIndex = this.getLocalSaintIndexWithId(newSaintId);
    let i = 1;
    let suffix = '';
    while (matchingSaintIndex !== -1) {
      i++;
      suffix = '_' + i.toString();
      matchingSaintIndex = this.getLocalSaintIndexWithId(newSaintId + suffix);
    }
    return newSaintId + suffix;
  }

  makeIdForRelic(relic: Relic, saints: Saint[]): string {
    if (saints.length < 1) {
      alert('Making a relic with no saints :o');
    }
    let newRelicId = '';
    saints.forEach((saint: Saint) => {
      if (newRelicId !== '') {
        newRelicId = newRelicId + '_&_';
      }
      const saintId = saint.firebaseDocId || this.makeIdForSaint(saint);
      newRelicId = newRelicId + saintId;
    });
    let materials = '';
    if (relic.relicMaterials && relic.relicMaterials.length > 0) {
      materials = '_' + relic.relicMaterials.join('_&_') + '_';
    }
    newRelicId = relic.inPhoto.split('.')[0] + '_' +
                 newRelicId +
                 materials +
                 Math.floor(relic.photoNaturalCoords[0]).toString() + '_' +
                 Math.floor(relic.photoNaturalCoords[1]).toString();
    if (this.getLocalRelicIndexWithId(newRelicId) >= 0) {
      alert('Relic with matching id - overwriting data for existing relic!');
    }
    return newRelicId;
  }
}
