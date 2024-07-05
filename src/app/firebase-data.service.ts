import { Component, ViewChild } from '@angular/core';
import {
  PhotoInfo,
  Relic,
  ZoomArea,
  User,
  Saint,
  RelicAndSaints,
  CanonizationStatus,
  PhotoArrows,
} from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { Firestore } from '@angular/fire/firestore';
import { bindCallback, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { initializeApp } from "firebase/app";
import { firestore } from 'firebase/app';

type TraversalResult = {
  successful: boolean;
  path: string[];
  visited: string[];
};

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  allRelicsLocal: Relic[] = [];
  allZoomAreasLocal: ZoomArea[] = [];
  allSaintsLocal: Saint[] = [];
  allArrowsLocal: PhotoArrows[] = [];

  constructor(private firestore: Firestore) {}

  getInitialServerData(callback: () => void): void {
    firestore().collection('relics')
      .get()
      .then((relicsSnapshot) => {
        const relicsList = relicsSnapshot.docs.map(doc => ({ ...doc.data(), firebaseDocId: doc.id }));
        console.log('relics', relicsList);
    
        firestore()
          .collection('zoomAreas')
          .get()
          .then((zoomAreasSnapshot) => {
            const zoomAreasList = zoomAreasSnapshot.docs.map(doc => ({ ...doc.data(), firebaseDocId: doc.id }));
            console.log('zoomAreas', zoomAreasList);
    
            firestore()
              .collection('saints')
              .get()
              .then((saintsSnapshot) => {
                const saintsList = saintsSnapshot.docs.map(doc => ({ ...doc.data(), firebaseDocId: doc.id }));
                console.log('saints', saintsList);
    
                firestore()
                  .collection('arrows')
                  .get()
                  .then((arrowsSnapshot) => {
                    const arrowsList = arrowsSnapshot.docs.map(doc => ({ ...doc.data(), firebaseDocId: doc.id }));
    
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
    firestore()
      .collection('zoomAreas')
      .doc(newZAId)
      .set(zoomArea)
      .then(() => {
        console.log('za created:', zoomArea);
        this.allZoomAreasLocal.push(zoomArea);
      })
      .catch((error) => {
        console.error('Error creating zoom area:', error, zoomArea);
      });
  }

  updateZoomArea(zoomArea: ZoomArea): void {
    if (!zoomArea.firebaseDocId) {
      return;
    }
    firestore()
      .collection('zoomAreas')
      .doc(zoomArea.firebaseDocId)
      .update(zoomArea)
      .then(() => {
        console.log('Zoom area updated', zoomArea);
      })
      .catch((error) => {
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

  /** Callback param for autofill only. */
  addOrUpdateRelicAndSaints(
    relicAndSaints: RelicAndSaints,
    callback?: () => void
  ): void {
    console.log('add or update:', relicAndSaints);
    const relic = relicAndSaints[0];
    const saints = relicAndSaints[1];
    // Validate there is at least a saint name.
    if (relic && saints && saints[0] && saints[0].name) {
      if (!relic.firebaseDocId) {
        // ADD new relic/saints
        this.updateOrAddSaints(saints);
        this.addRelic(relic, saints, callback);
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
    firestore()
      .collection('relics')
      .doc(relic.firebaseDocId)
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
        firestore().collection('saints').doc(newSaintId).set(saint);
        // Add locally
        this.allSaintsLocal.push(saint);
      } else {
        const indexMatch = this.getLocalSaintIndexWithId(saint.firebaseDocId);
        if (indexMatch >= 0) {
          // UPDATE Firebase
          firestore()
            .collection('saints')
            .doc(saint.firebaseDocId)
            .set(saint);
          // Update locally
          this.allSaintsLocal[indexMatch] = saint;
        } else {
          alert(
            'Data will not be saved for this saint - ' +
              'no firebase doc id match: ' +
              saint.firebaseDocId
          );
        }
      }
    });
  }

  /** Callback param for autofill only. */
  addRelic(relic: Relic, saints: Saint[], callback?: () => void): void {
    this.updateSaintIdsInRelic(relic, saints);
    const newRelicId = this.makeIdForRelic(relic, saints);
    relic.firebaseDocId = newRelicId;
    console.log('NEW RELIC ID: ', newRelicId);
    firestore()
      .collection('relics')
      .doc(newRelicId)
      .set(relic)
      .then(() => {
        console.log(
          'successful write of new relic doc - firebase id: ' + newRelicId
        );
        // Update local data
        this.allRelicsLocal.push(relic);
        if (callback) {
          callback();
        }
      })
      .catch((error) => {
        console.error(error);
        alert('Relic could not be written (Are you logged in?): ' + error);
      });
  }

  updateSaintIdsInRelic(relic: Relic, saints: Saint[]): void {
    relic.saintFirebaseDocIds = saints.map((s) => {
      if (!s.firebaseDocId) {
        alert(
          'Aborting; missing firebase doc id for saint ' + JSON.stringify(s)
        );
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
      const relicIndex = this.getLocalRelicIndexWithId(
        updatedRelic.firebaseDocId
      );
      updatedRelic = this.allRelicsLocal[relicIndex];
    }
    saints.forEach((s) => {
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
    relic.saintFirebaseDocIds.forEach((saintFirebaseId) => {
      const saintIndex = this.getLocalSaintIndexWithId(saintFirebaseId);
      saints.push(this.allSaintsLocal[saintIndex]);
    });
    return saints;
  }

  getRelicsForSaint(saint: Saint): Relic[] {
    const saintId = saint.firebaseDocId || '';
    return this.allRelicsLocal.filter((r) => {
      return r.saintFirebaseDocIds.includes(saintId);
    });
  }

  private zoomInListToPhoto(photoFilename: string): string[] {
    const pathList: string[] = [];
    const zoomAreaOneLevelUp = this.allZoomAreasLocal.find((za) => {
      return za.zoomToPhotoFilename === photoFilename;
    });
    if (zoomAreaOneLevelUp) {
      const picOneLevelUp = zoomAreaOneLevelUp.zoomFromPhotoFilename;
      return this.zoomInListToPhoto(picOneLevelUp).concat([photoFilename]);
    } else {
      return [photoFilename];
    }
  }

  private traverseEachArrow(
    arrows: PhotoArrows,
    toPhotoFilename: string,
    visited: string[]
  ): TraversalResult {
    let traversalResult: TraversalResult;
    const curPhotoFilename = arrows.photoFilename;
    const arrowList = this.getArrowsAsList(arrows);
    for (let i in arrowList) {
      let picToCheck = arrowList[i];
      traversalResult = this.traverse(picToCheck, toPhotoFilename, visited);
      if (traversalResult.successful) {
        return traversalResult;
      } else {
        visited = visited.concat(traversalResult.visited);
      }
    }
    return {
      successful: false,
      path: [],
      visited: visited.concat(curPhotoFilename),
    };
  }

  private traverse(
    fromPhotoFilename: string,
    toPhotoFilename: string,
    visited: string[] = []
  ): TraversalResult {
    console.log('traversing', fromPhotoFilename);
    // SUCCESS
    if (fromPhotoFilename === toPhotoFilename) {
      return { successful: true, path: [fromPhotoFilename], visited };
    }
    // Already visited, go back.
    else if (visited.includes(fromPhotoFilename)) {
      return { successful: false, path: [], visited };
    }
    // Update visited when first arriving at each node.
    visited = visited.concat([fromPhotoFilename]);
    const arrows = this.getLocalArrowsWithPhotoFilename(fromPhotoFilename);
    // Not a success and no arrows here to explore, go back.
    if (!arrows) {
      return { successful: false, path: [], visited };
    }
    // Not success, so keep on traversing in each direction.
    else {
      const result = this.traverseEachArrow(arrows, toPhotoFilename, visited);
      return {
        successful: result.successful,
        path: result.path.concat([fromPhotoFilename]),
        visited,
      };
    }
  }

  private findTopLevelPath(
    fromPhotoFilename: string,
    toPhotoFilename: string
  ): string[] {
    let result = this.traverse(fromPhotoFilename, toPhotoFilename);
    if (result.successful) {
      return result.path;
    } else {
      console.error(
        'No path found from',
        fromPhotoFilename,
        'to',
        toPhotoFilename
      );
      return [];
    }
  }

  /**
   * Get the path from currentPhotoFilename to the Relic, of photo filenames,
   * going in order of clicks of arrows or zoom areas from now to the relic.
   * It will always be in order of:
   *  - zooming out from where you are (if not at the top level)
   *  - using arrows at the top-most level
   *  - zooming into where you need to go
   */
  getPathToRelic(relic: Relic, currentPhotoFilename: string): string[] {
    const zoomingInToRelic = this.zoomInListToPhoto(relic.inPhoto);
    const zoomingInToCurrent = this.zoomInListToPhoto(currentPhotoFilename);
    // Shift outermost elements off arrays since they will be included in top level path.
    const zoomedOutFromRelic = zoomingInToRelic[0];
    const zoomedOutFromCurrentPhoto = zoomingInToCurrent[0];
    const zoomedOutPathViaArrows = this.findTopLevelPath(
      zoomedOutFromRelic,
      zoomedOutFromCurrentPhoto
    );
    console.log(
      'zoomingInToCurrent',
      zoomingInToCurrent,
      'zoomedOutPathViaArrows',
      zoomedOutPathViaArrows,
      'zoomingInToRelic',
      zoomingInToRelic
    );
    // Remove duplicate path elements before combining.
    zoomingInToCurrent.pop(); // remove starting pic
    zoomedOutPathViaArrows.shift(); // remove first from arrow path
    zoomingInToRelic.shift(); // remove first from zooming in path
    const zoomingOutFromCurrent = zoomingInToCurrent.reverse();
    return zoomingOutFromCurrent.concat(
      zoomedOutPathViaArrows.concat(zoomingInToRelic)
    );
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
    const fullPath =
      'https://firebasestorage.googleapis.com/v0/b/' +
      'relic-finder.appspot.com/o/zas%2F' +
      `${name}_1600x1600.${filetype}?alt=media`;
    return fullPath;
  }

  getPhotoArrows(photoFilename: string): PhotoArrows | undefined {
    return this.allArrowsLocal.find((arrows) => {
      return arrows.photoFilename === photoFilename;
    });
  }

  // If updated reverse arrow, send back the reverse arrow data.
  updatePhotoArrowsBothDirections(
    newArrows: PhotoArrows,
    direction: string,
    newPhoto: string
  ): PhotoArrows | void {
    // Assumes the newArrows has already been updated for one direction.
    this.addOrUpdatePhotoArrows(newArrows);
    // Add arrow in reverse direction.
    const reverseDirection = this.getReverseDirection(direction);
    let linkedPhotoArrows = this.getLocalArrowsWithPhotoFilename(newPhoto);
    if (!linkedPhotoArrows) {
      linkedPhotoArrows = {
        photoFilename: newPhoto,
      } as PhotoArrows;
    }
    const reverseDirectionHasArrow = this.directionHasArrow(
      linkedPhotoArrows,
      reverseDirection
    );
    let updateReverseArrow = true;
    if (reverseDirectionHasArrow) {
      updateReverseArrow = confirm('Overwrite arrow in reverse direction?');
    }
    if (updateReverseArrow) {
      if (reverseDirection === 'left') {
        linkedPhotoArrows.leftToPhoto = newArrows.photoFilename;
      } else if (reverseDirection === 'right') {
        linkedPhotoArrows.rightToPhoto = newArrows.photoFilename;
      } else if (reverseDirection === 'up') {
        linkedPhotoArrows.upToPhoto = newArrows.photoFilename;
      } else if (reverseDirection === 'down') {
        linkedPhotoArrows.downToPhoto = newArrows.photoFilename;
      } else {
        alert('Direction invalid for reverse arrow: ' + reverseDirection);
      }
      this.addOrUpdatePhotoArrows(linkedPhotoArrows);
      return linkedPhotoArrows;
    }
  }

  addOrUpdatePhotoArrows(newArrows: PhotoArrows): void {
    const arrowsId = newArrows.firebaseDocId;
    if (!arrowsId) {
      // new arrows
      newArrows.firebaseDocId = newArrows.photoFilename + '-arrows';
      firestore()
        .collection('arrows')
        .doc(newArrows.firebaseDocId)
        .set(newArrows)
        .then(() => {
          console.log(
            'successful write of new arrows doc - firebase id: ' +
              newArrows.firebaseDocId
          );
        })
        .catch((error) => {
          console.error(error);
          alert('Error adding new arrow: ' + error);
        })
        .finally(() => {
          console.log('successfully added arrows: ', newArrows);
        });
      // Update local data
      this.allArrowsLocal.push(newArrows);
    } else {
      // update existing arrow
      firestore()
        .collection('arrows')
        .doc(arrowsId)
        .update(newArrows)
        .then(() => {
          console.log('Arrows updated:', arrowsId, newArrows);
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

  getReverseDirection(direction: string): string {
    let reverseDirection = '';
    if (direction === 'left') {
      reverseDirection = 'right';
    } else if (direction === 'right') {
      reverseDirection = 'left';
    } else if (direction === 'up') {
      reverseDirection = 'down';
    } else if (direction === 'down') {
      reverseDirection = 'up';
    }
    if (reverseDirection === '') {
      alert('Input direction invalid for reverseDirection: ' + direction);
      console.error(
        'Input direction invalid for reverseDirection: ',
        direction
      );
    }
    return reverseDirection;
  }

  directionHasArrow(arrows: PhotoArrows, direction: string): boolean {
    if (direction === 'left') {
      return !!arrows.leftToPhoto;
    } else if (direction === 'right') {
      return !!arrows.rightToPhoto;
    } else if (direction === 'up') {
      return !!arrows.upToPhoto;
    } else if (direction === 'down') {
      return !!arrows.downToPhoto;
    } else {
      alert('Invalid direction given to directionHasArrow: ' + direction);
      console.error(
        'Invalid direction given to directionHasArrow: ',
        direction
      );
      return false;
    }
  }

  getArrowsAsList(arrows: PhotoArrows): string[] {
    const result = [];
    if (arrows.leftToPhoto) {
      result.push(arrows.leftToPhoto);
    }
    if (arrows.rightToPhoto) {
      result.push(arrows.rightToPhoto);
    }
    if (arrows.upToPhoto) {
      result.push(arrows.upToPhoto);
    }
    if (arrows.downToPhoto) {
      result.push(arrows.downToPhoto);
    }
    return result;
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
    return this.allZoomAreasLocal.findIndex((za) => {
      return za.firebaseDocId === relicFirebaseId;
    });
  }

  getLocalArrowsIndexWithId(arrowsId: string): number {
    return this.allArrowsLocal.findIndex((arrow) => {
      return arrow.firebaseDocId === arrowsId;
    });
  }

  getLocalArrowsWithPhotoFilename(filename: string): PhotoArrows | undefined {
    return this.allArrowsLocal.find((arrow) => {
      return arrow.photoFilename === filename;
    });
  }

  makeIdForZoomArea(za: ZoomArea): string {
    let newZAId = za.zoomFromPhotoFilename.split('.')[0];
    newZAId = newZAId + '_to_' + za.zoomToPhotoFilename.split('.')[0];
    newZAId = newZAId + '_' + Math.floor(za.topLeftNaturalCoords[0]).toString();
    newZAId = newZAId + '_' + Math.floor(za.topLeftNaturalCoords[1]).toString();
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
      const underscoreStrings = relic.relicMaterials.map((m) =>
        m.replace(/ /g, '_')
      );
      materials = '_' + underscoreStrings.join('_&_') + '_';
    } else {
      materials = '_';
    }
    newRelicId =
      relic.inPhoto.split('.')[0] +
      '_' +
      newRelicId +
      materials +
      Math.floor(relic.photoNaturalCoords[0]).toString() +
      '_' +
      Math.floor(relic.photoNaturalCoords[1]).toString();
    if (this.getLocalRelicIndexWithId(newRelicId) >= 0) {
      alert('Relic with matching id - overwriting data for existing relic!');
    }
    return newRelicId;
  }
}
