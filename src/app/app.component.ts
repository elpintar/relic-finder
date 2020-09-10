import { Component } from '@angular/core';
import { PhotoInfo, Relic } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'relic-finder';
  editMode = true;
  zoomedList: string[] = [];

  currentCabinetScene: PhotoInfo = {
    photoIdName: 'CDEF',
    photoImgPath: 'assets/pics/CDEF.jpg',
    relicsInPhoto: [0, 1],
    zoomAreasInPhoto: ['D'],
  };

  photos = new Map()
    .set('CDEF', Object.assign({}, this.currentCabinetScene));

  relics: Relic[] = [
    {
      relicId: 0,
      saint: {name: 'St. Francis of Assisi',
      feastDayAndMonth: 'October 4',
      vocation: 'founder'},
      chapelLocation: 'D42',
    },
  ];

  changeCabinetScene(photoToChangeTo: string): void {
    if (this.photos.has(photoToChangeTo)) {
      this.currentCabinetScene = this.photos.get(photoToChangeTo);
    } else {
      this.currentCabinetScene = {
        photoIdName: photoToChangeTo,
        photoImgPath: 'assets/pics/' + photoToChangeTo + '.jpg',
        relicsInPhoto: [],
        zoomAreasInPhoto: [],
      }
    }
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

  addZoomArea(coords: [number, number]): void {
  }

  addRelic(coords: [number, number]): void {
    console.log(coords[0], coords[1]);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }
}
