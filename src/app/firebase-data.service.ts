import {
  Relic,
  ZoomArea,
  Saint,
  RelicAndSaints,
  CanonizationStatus,
  PhotoArrows,
} from './types';
import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, doc, addDoc, updateDoc, setDoc, Query } from '@angular/fire/firestore';
import { from, Observable, combineLatest, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

interface TraversalResult {
  successful: boolean;
  path: string[];
  visited: string[];
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  private firestore: Firestore = inject(Firestore);

  allRelicsLocal: Relic[] = [];
  allZoomAreasLocal: ZoomArea[] = [];
  allSaintsLocal: Saint[] = [];
  allArrowsLocal: PhotoArrows[] = [];

  relics$: Observable<Relic[]>; 
  zoomAreas$: Observable<ZoomArea[]>;
  saints$: Observable<Saint[]>;
  arrows$: Observable<PhotoArrows[]>;

  constructor() {
    const relicCollection = collection(this.firestore, 'relics');
    const relicQuery = query(relicCollection) as Query<Relic>;
    this.relics$ = collectionData<Relic>(relicQuery);

    const zoomAreaCollection = collection(this.firestore, 'zoomAreas');
    const zoomAreaQuery = query(zoomAreaCollection) as Query<ZoomArea>;
    this.zoomAreas$ = collectionData<ZoomArea>(zoomAreaQuery);

    const saintCollection = collection(this.firestore, 'saints');
    const saintQuery = query(saintCollection) as Query<Saint>;
    this.saints$ = collectionData<Saint>(saintQuery);

    const arrowCollection = collection(this.firestore, 'arrows');
    const arrowQuery = query(arrowCollection) as Query<PhotoArrows>;
    this.arrows$ = collectionData<PhotoArrows>(arrowQuery);
  }

  getInitialServerData(callback: () => void) {
    console.log("getInitialServerData");
    combineLatest([
      this.relics$,
      this.zoomAreas$,
      this.saints$,
      this.arrows$
    ]).pipe(
      tap({
        next: ([relics, zoomAreas, saints, arrows]) => {
          this.allRelicsLocal = relics;
          this.allZoomAreasLocal = zoomAreas;
          this.allSaintsLocal = saints;
          this.allArrowsLocal = arrows;
          callback();
        },
        error: (error) => {
          console.error(error);
        }
      })
    ).subscribe();
  }

  createZoomArea(zoomArea: ZoomArea): Observable<ZoomArea> {
    const newZAId = this.makeIdForZoomArea(zoomArea); 
    zoomArea.firebaseDocId = newZAId;

    const zoomAreasCollection = collection(this.firestore, 'zoomAreas');
    return from(addDoc(zoomAreasCollection, zoomArea)).pipe(
      tap((docRef) => {
        console.log('Zoom area created with ID:', docRef.id);
      }),
      map(() => zoomArea),
      catchError((error) => {
        console.error('Error creating zoom area:', error);
        throw error;
      })
    );
  }

  updateZoomArea(zoomArea: ZoomArea): Observable<void> {
    if (!zoomArea.firebaseDocId) {
      return of(undefined);
    }

    const zoomAreaRef = doc(this.firestore, 'zoomAreas', zoomArea.firebaseDocId);
    return from(updateDoc(zoomAreaRef, zoomArea as {})).pipe(
      tap(() => {
        console.log('Zoom area updated:', zoomArea);
      }),
      catchError((error) => {
        console.error('Error updating zoom area:', error);
        throw error;
      })
    );
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

  updateRelic(relic: Relic, saints: Saint[]): Observable<void> {
    if (!relic.firebaseDocId) {
      return throwError(() => new Error('No relic firebaseDocId'));
    }

    this.updateSaintIdsInRelic(relic, saints);

    const relicRef = doc(this.firestore, 'relics', relic.firebaseDocId);
    return from(updateDoc(relicRef, relic as {})).pipe(
      tap(() => console.log('Relic updated:', relic.firebaseDocId, relic)),
      catchError((error) => {
        console.error('Error updating relic:', error);
        throw error; 
      })
    );
  }

  updateOrAddSaints(saints: Saint[]): Observable<void[]> {
    const updates = saints.map((saint) => {
      if (!saint.firebaseDocId) {
        const newSaintId = this.makeIdForSaint(saint);
        saint.firebaseDocId = newSaintId;
        const saintRef = doc(this.firestore, 'saints', newSaintId);
        return from(setDoc(saintRef, saint));
      } else {
        const saintRef = doc(this.firestore, 'saints', saint.firebaseDocId);
        return from(updateDoc(saintRef, saint as {}));
      }
    });
    return forkJoin(updates); // Execute all updates concurrently
  }
    

  addRelic(relic: Relic, saints: Saint[], callback?: () => void): Observable<string> {
    this.updateSaintIdsInRelic(relic, saints);
    const newRelicId = this.makeIdForRelic(relic, saints);
    relic.firebaseDocId = newRelicId;

    const relicsCollection = collection(this.firestore, 'relics');
    return from(addDoc(relicsCollection, relic)).pipe(
      tap((docRef) => {
        console.log('Relic added with ID:', docRef.id);
        if (callback) {
          callback();
        }
      }),
      map((docRef) => docRef.id), // Return the newly created relic's ID
      catchError((error) => {
        console.error('Error adding relic:', error);
        throw error;
      })
    );
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
    for (const i in arrowList) {
      const picToCheck = arrowList[i];
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
    const result = this.traverse(fromPhotoFilename, toPhotoFilename);
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

  addOrUpdatePhotoArrows(newArrows: PhotoArrows): Observable<PhotoArrows> {
    const arrowsId = newArrows.firebaseDocId;

    if (!arrowsId) {
      // New arrows
      newArrows.firebaseDocId = newArrows.photoFilename + '-arrows';
      const arrowsCollection = collection(this.firestore, 'arrows');
      return from(addDoc(arrowsCollection, newArrows)).pipe(
        tap((docRef) => {
          console.log('Arrows added with ID:', docRef.id);
          // Update local data
          this.allArrowsLocal.push(newArrows);
        }),
        map(() => newArrows),
        catchError((error) => {
          console.error('Error adding arrows:', error);
          throw error; // Rethrow the error
        })
      );
    } else {
      // Update existing arrows
      const arrowsRef = doc(this.firestore, 'arrows', arrowsId);
      return from(updateDoc(arrowsRef, newArrows as {})).pipe(
        tap(() => {
          console.log('Arrows updated:', arrowsId, newArrows);
          // Update local data
          const indexMatch = this.getLocalArrowsIndexWithId(arrowsId);
          if (indexMatch >= 0) {
            this.allArrowsLocal[indexMatch] = newArrows;
          } else {
            alert('No matching arrows found to update locally!');
          }
        }),
        map(() => newArrows),
        catchError((error) => {
          console.error('Error updating arrows:', error);
          throw error;
        })
      );
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
