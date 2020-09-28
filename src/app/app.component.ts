import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomAreaInfo } from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  @ViewChild(CabinetSceneComponent)
  private cabinetSceneComponent?: CabinetSceneComponent;

  title = 'relic-finder';
  editMode = true;
  addRelicMode = true;
  zoomedList: string[] = [];
  leftRightList: string[] = ['ZeZf', 'ZaZb', 'WXYZ', 'TUV',
    'S', 'MNOPQ', 'M', 'K',
    'GHJ', 'CDEF', 'B', 'A', 'ZgZcZh'];
  leftRightIndex = 5;

  currentPhotoInfo: PhotoInfo = {
    photoIdName: 'MNOPQ',
    photoImgPath: 'assets/pics/MNOPQ.jpg',
    relicsInPhoto: [],
    zoomAreasInPhoto: [],
    naturalImgWidth: 0, // will be replaced by load call of image
    naturalImgHeight: 0, // will be replaced by load call of image
  };

  photos = new Map()
    .set(this.leftRightList[this.leftRightIndex], Object.assign({}, this.currentPhotoInfo));

  zoomAreas = new Map();

  relics = new Map();

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
        zoomAreasInPhoto: [],
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

  cabinetSceneImgChanged(): void {
    this.sendRedrawInfo(this.currentPhotoInfo.photoIdName);
  }

  sendRedrawInfo(photoToChangeTo: string): void {
    const relicsInScene: Relic[] = [];
    this.relics.forEach((relic: Relic) => {
      if (relic.inPhoto === photoToChangeTo) {
        relicsInScene.push(relic);
      }
    });
    const zoomAreasInScene: ZoomAreaInfo[] = [];
    this.zoomAreas.forEach((zoomArea: ZoomAreaInfo) => {
      if (zoomArea.zoomFromPhotoId === photoToChangeTo) {
        zoomAreasInScene.push(zoomArea);
      }
    });
    if (!this.cabinetSceneComponent) {
      throw new Error('No cabinet scene component!');
    }
    this.cabinetSceneComponent.redrawScene(relicsInScene, zoomAreasInScene);
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

  // Updates data (but doesn't change view).
  // Called after adding a new zoom area, before zooming into it.
  addZoomArea(zoomAreaInfo: ZoomAreaInfo): void {
    console.log('new zoom area info', zoomAreaInfo);
    this.currentPhotoInfo.zoomAreasInPhoto?.push(zoomAreaInfo.zoomToPhotoId);
    this.zoomAreas.set(zoomAreaInfo.zoomFromPhotoId, zoomAreaInfo);
    console.log('zoomAreas:', this.zoomAreas);
  }

  addRelicDot(relic: Relic): void {
    console.log(relic);
    this.relics.set(relic.relicId, relic);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  toggleAddRelicMode(): void {
    this.addRelicMode = !this.addRelicMode;
  }
}
