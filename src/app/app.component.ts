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
  addRelicMode = false;
  zoomedList: string[] = [];
  leftRightList: string[] = ['ZeZf', 'ZaZb', 'WXYZ', 'TUV',
    'S', 'MNOPQ', 'M', 'K',
    'GHJ', 'CDEF', 'B', 'A', 'ZgZcZh'];
  leftRightIndex = 5;

  currentCabinetScene: PhotoInfo = {
    photoIdName: 'MNOPQ',
    photoImgPath: 'assets/pics/MNOPQ.jpg',
    relicsInPhoto: [],
    zoomAreasInPhoto: [],
  };

  photos = new Map()
    .set(this.leftRightList[this.leftRightIndex], Object.assign({}, this.currentCabinetScene));

  zoomAreas = new Map();

  relics: Relic[] = [
    {
      relicId: 0,
      saint: {name: 'St. Francis of Assisi',
      feastDayAndMonth: 'October 4',
      vocation: 'founder'},
      inPhoto: 'NOP',
      photoCoords: [1, 2],
      chapelLocation: 'D42',
    },
  ];

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
      this.currentCabinetScene = this.photos.get(photoToChangeTo);
    } else {
      this.currentCabinetScene = {
        photoIdName: photoToChangeTo,
        photoImgPath: 'assets/pics/' + photoToChangeTo + '.jpg',
        relicsInPhoto: [],
        zoomAreasInPhoto: [],
      };
      // Add new photo area to the set of photos.
      this.photos.set(photoToChangeTo, this.currentCabinetScene);
    }
    this.sendRedrawInfo(photoToChangeTo);

    console.log('changed cabinet scene to ', photoToChangeTo);
    console.log('currentCabinetScene', this.currentCabinetScene,
    'photos', this.photos,
    'relics', this.relics);
  }

  sendRedrawInfo(photoToChangeTo: string): void {
    const zoomAreasInScene: ZoomAreaInfo[] = [];
    this.zoomAreas.forEach((zoomArea: ZoomAreaInfo) => {
      if (zoomArea.zoomFromPhotoId === photoToChangeTo) {
        zoomAreasInScene.push(zoomArea);
      }
    });
    if (!this.cabinetSceneComponent) {
      throw new Error('No cabinet scene component!');
    }
    this.cabinetSceneComponent.redrawScene(zoomAreasInScene);
  }

  zoomIn(photoToChangeTo: string): void {
    this.zoomedList.unshift(this.currentCabinetScene.photoIdName);
    this.changeCabinetScene(photoToChangeTo);
  }

  zoomOut(): void {
    const zoomToPic = this.zoomedList.shift();
    if (!zoomToPic) {
      throw new Error('No picture to zoom out from!');
    }
    this.changeCabinetScene(zoomToPic);
  }

  // Called after adding a new zoom area, before zooming into it.
  // Data update only, doesn't change view.
  addZoomArea(zoomAreaInfo: ZoomAreaInfo): void {
    console.log('new zoom area info', zoomAreaInfo);
    this.currentCabinetScene.zoomAreasInPhoto?.push(zoomAreaInfo.zoomToPhotoId);
    this.zoomAreas.set(zoomAreaInfo.zoomFromPhotoId, zoomAreaInfo);
    console.log('zoomAreas:', this.zoomAreas);
  }

  addRelic(coords: [number, number]): void {
    // TODO
    console.log(coords[0], coords[1]);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  toggleAddRelicMode(): void {
    this.addRelicMode = !this.addRelicMode;
  }
}
