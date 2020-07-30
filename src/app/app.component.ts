import { Component } from '@angular/core';
import { PhotoInfo, Relic } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'relic-finder';

  photoInfo: PhotoInfo = {
    photoIdName: 'CDEF',
    photoImgPath: 'assets/pics/CDEF.jpg',
    relicsInPhoto: [0, 1],
    photosInPhoto: ['D'],
  };

  relics: Relic[] = [
    {
      relicId: 0,
      saint: {name: 'St. Francis of Assisi',
      feastDayAndMonth: 'October 4',
      vocation: 'founder'},
      chapelLocation: 'D42',
    },
  ];



  addZoomArea(coords: [number, number]): void {
  }

  addRelic(coords: [number, number]): void {
    console.log(coords[0], coords[1]);
  }
}
