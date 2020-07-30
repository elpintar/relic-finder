import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {PhotoInfo} from '../types';

@Component({
  selector: 'app-cabinet-scene',
  templateUrl: './cabinet-scene.component.html',
  styleUrls: ['./cabinet-scene.component.sass']
})
export class CabinetSceneComponent implements OnInit {
  @Input() photoInfo: PhotoInfo;

  @Output() mousedownInCabinetStarted = new EventEmitter<[number, number]>();
  @Output() draggingZoomArea = new EventEmitter<[number, number]>();
  @Output() doneDraggingZoomArea = new EventEmitter<[number, number]>();
  @Output() clickToAddRelic = new EventEmitter<[number, number]>();

  photoDirectory = '/assets/pics/';
  mousedownStart = 0;
  zoomStart = [-1, -1];
  zoomDragPoint = [-1, -1];

  constructor() {
    this.photoInfo = {photoIdName: ''};
  }

  ngOnInit(): void {
    const photoId = this.photoInfo.photoIdName;
    if (!photoId) {
      throw new Error('No photo id assigned to cabinetSceneComponent!');
    }
    if (!this.photoInfo.photoImgPath) {
      this.photoInfo.photoImgPath = this.photoDirectory + photoId + '.jpg';
    }
  }

  mousedownInCabinet(event: MouseEvent): void {
    this.mousedownStart = new Date().getTime();
    this.mousedownInCabinetStarted.emit([event.offsetX, event.offsetY]);
  }

  mousemoveInCabinet(event: MouseEvent): void {
    const currentMs = new Date().getTime();
    if (this.mousedownStart > 0 &&
        currentMs - this.mousedownStart > 1000) {
      this.draggingZoomArea.emit([event.offsetX, event.offsetY]);
    }
  }

  mouseupInCabinet(event: MouseEvent): void {
    const currentMs = new Date().getTime();
    if (currentMs - this.mousedownStart < 1000) {
      this.clickToAddRelic.emit([event.offsetX, event.offsetY]);      
    } else {
      this.doneDraggingZoomArea.emit([event.offsetX, event.offsetY]);
    }
    this.mousedownStart = 0;
    this.resetZoomInfo();
  }

  tentativelyStartZoomArea(coords: [number, number]): void {
    this.zoomStart = coords;
  }

  updateZoomAreaCoords(coords: [number, number]): void {
    if (this.zoomStart[0] === -1 &&
        this.zoomStart[1] === -1) {
      this.makeNewZoomArea(this.zoomStart, coords);
    } else {
      this.updateZoomArea(coords);
    }
  }

  makeNewZoomArea(startCoords, endCoords): void {
    
  }

  updateZoomArea(endCoords): void {
    
  }

  resetZoomInfo(): void {
    this.zoomStart = [-1, -1];
    this.zoomDragPoint = [-1, -1];
  }
}
