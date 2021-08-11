import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomArea, User, Saint, RelicAndSaints, CanonizationStatus, PhotoArrows } from './types';
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
  allArrowsLocal: PhotoArrows[] = [];

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
          this.firestore.collection('arrows')
              .valueChanges({idField: 'firebaseDocId'}).pipe(take(1)).subscribe((arrowsList) => {
            this.allRelicsLocal = relicsList as Relic[];
            this.allZoomAreasLocal = zoomAreasList as ZoomArea[];
            this.allSaintsLocal = saintsList as Saint[];
            this.allArrowsLocal = arrowsList as PhotoArrows[];
            callback();
          });
        });
      });
    });
  }

  createZoomArea(zoomArea: ZoomArea): void {
    console.log('new zoom area info', zoomArea);
    const newZAId = this.makeIdForZoomArea(zoomArea);
    zoomArea.firebaseDocId = newZAId;
    this.firestore.collection<ZoomArea>('zoomAreas').doc(newZAId)
      .set(zoomArea)
      .then(() => {
        console.log('za created: ', zoomArea);
        // Update local zoom area data.
        this.allZoomAreasLocal.push(zoomArea);
      })
      .catch((reason: string) => {
        console.error('Error creating zoom area: ', reason, zoomArea);
      });
  }

  updateZoomArea(zoomArea: ZoomArea): void {
    if (!zoomArea.firebaseDocId) {
      return;
    }
    this.firestore.collection<ZoomArea>('zoomAreas')
      .doc(zoomArea.firebaseDocId)
      .update(zoomArea)
      .then(() => {
        console.log('Zoom area updated', zoomArea);
      })
      .catch(error => {
        console.error('Error updating zoom area:', error);
      });
    // Update local data.
    const indexMatch = this.getLocalZoomAreaIndexWithId(zoomArea.firebaseDocId);
    if (indexMatch >= 0) {
      this.allZoomAreasLocal[indexMatch] = zoomArea;
    } else {
      alert('No matching zoom area found to update locally!');
    }
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

  getPhotoArrows(photoFilename: string): PhotoArrows|undefined {
    return this.allArrowsLocal.find((arrows) => {
      return arrows.photoFilename === photoFilename;
    });
  }

  addOrUpdatePhotoArrows(newArrows: PhotoArrows): void {
    const arrowsId = newArrows.firebaseDocId;
    if (!arrowsId) {
      // new arrows
      newArrows.firebaseDocId = newArrows.photoFilename;
      this.firestore.collection<PhotoArrows>('arrows').doc(arrowsId).set(newArrows)
      .then(() => {
        console.log('successful write of new arrows doc - firebase id: ' + newArrows.firebaseDocId);
      })
      .catch((reason: string) => {
        console.error(reason);
        alert('Reminder: your data is not being saved.');
      }).finally(() => {
        console.log('successfully added arrows: ', newArrows);
      });
      // Update local data
      this.allArrowsLocal.push(newArrows);
    } else {
      this.firestore.collection<PhotoArrows>('arrows').doc(newArrows.firebaseDocId)
      .update(newArrows)
      .then(() => {
        console.log('Arrows updated:', newArrows.firebaseDocId, newArrows);
      })
      .catch((error) => {
        console.error('Error updating arrows document: ', error);
      });
      // Update local data.
      const indexMatch = this.getLocalArrowsIndexWithId(arrowsId);
      if (indexMatch >= 0) {
        this.allArrowsLocal[indexMatch] = newArrows;
      } else {
        alert('No matching arrows found to update locally!');
      }
    }
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

  getLocalZoomAreaIndexWithId(relicFirebaseId: string): number {
    return this.allZoomAreasLocal.findIndex(za => {
      return za.firebaseDocId === relicFirebaseId;
    });
  }

  getLocalArrowsIndexWithId(arrowsId: string): number {
    return this.allArrowsLocal.findIndex(arrow => {
      return arrow.firebaseDocId === arrowsId;
    });
  }

  makeIdForZoomArea(za: ZoomArea): string {
    let newZAId = za.zoomFromPhotoFilename.split('.')[0];
    newZAId = newZAId + '_to_' + za.zoomToPhotoFilename.split('.')[0];
    newZAId = newZAId + '_' +
      Math.floor(za.topLeftNaturalCoords[0]).toString();
    newZAId = newZAId + '_' +
      Math.floor(za.topLeftNaturalCoords[1]).toString();
    return newZAId;
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
        newSaintId = newSaintId + '';
    }
    // Replace all spaces with underscores.
    newSaintId = newSaintId + saint.name.replace(/ /g, '_');
    if (saint.subtitle) {
      newSaintId = newSaintId + '_' + saint.subtitle.replace(/ /g, '_');
    } else if (saint.city) {
      newSaintId = newSaintId + '_of_' + saint.city.replace(/ /g, '_');
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
      const underscoreStrings = relic.relicMaterials.map(
        m => m.replace(/ /g, '_'));
      materials = '_' + underscoreStrings.join('_&_') + '_';
    } else {
      materials = '_';
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
