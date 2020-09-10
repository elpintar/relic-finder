import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentRef } from '@angular/core';
import {PhotoInfo, ZoomAreaInfo} from '../types';
import { ZoomAreaComponent } from './zoom-area/zoom-area.component';
import { MatDialog } from '@angular/material/dialog';
import { ZoomAreaDialogComponent } from './zoom-area-dialog/zoom-area-dialog.component';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-cabinet-scene',
  templateUrl: './cabinet-scene.component.html',
  styleUrls: ['./cabinet-scene.component.sass']
})
export class CabinetSceneComponent implements OnInit {
  @Input() photoInfo: PhotoInfo;
  @Input() editMode = false;
  @Input() addRelicMode = false;

  @Output() zoomIn = new EventEmitter<string>();
  @Output() addZoomArea = new EventEmitter<ZoomAreaInfo>();

  @ViewChild('cabinetImage', {read: ViewContainerRef}) cabinetImage?: ViewContainerRef;
  @ViewChild('zoomAreasContainer', {read: ViewContainerRef}) zoomAreasContainer?: ViewContainerRef;

  photoDirectory = '/assets/pics/';
  mousedownStart = 0;
  zoomStart = [-1, -1];
  zoomDragPoint = [-1, -1];

  zoomAreaComponentsToDestroy: ComponentRef<ZoomAreaComponent>[] = [];

  img?: HTMLImageElement;
  imgNaturalWidth = 0;
  imgNaturalHeight = 0;
  imgWidth = 0;
  imgHeight = 0;

  constructor(private resolver: ComponentFactoryResolver,
              private dialog: MatDialog) {
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

  clickInCabinet(event: MouseEvent): void {
    if (this.editMode) {
      this.updateZoomAreaCoords([event.offsetX, event.offsetY]);
    } else {
      this.addRelic([event.offsetX, event.offsetY]);
    }
    this.mousedownStart = 0;
  }

  addRelic(coords: [number, number]): void {
    //TODO
    console.log(coords);
  }

  redrawScene(zoomAreasInScene: ZoomAreaInfo[]): void {
    this.zoomAreaComponentsToDestroy.forEach((zoomAreaComponent) => {
      zoomAreaComponent.destroy();
    });
    zoomAreasInScene.forEach((zoomArea) => {
      this.putZoomAreaInScene(zoomArea);
    });
  }

  updateZoomAreaCoords(coords: [number, number]): void {
    if (this.zoomStart[0] === -1 &&
        this.zoomStart[1] === -1) {
      // upper lefthand corner click
      console.log('first click', coords, this.zoomStart);
      this.zoomStart = coords;
    } else {
      // bottom righthand corner click
      console.log(this.zoomStart, coords);
      this.makeNewZoomAreaFromCoords(this.zoomStart, coords);
      this.resetZoomInfo();
    }
  }

  makeNewZoomAreaFromCoords(topLeft: number[], bottomRight: number[]): void {
    if (!this.img) {
      throw new Error('No image data loaded in makeNewZoomArea');
    }
    const topLeftNaturalCoords = [
      (topLeft[0] / this.imgWidth) * this.imgNaturalWidth,
      (topLeft[1] / this.imgHeight) * this.imgNaturalHeight
    ];
    const bottomRightNaturalCoords = [
      (bottomRight[0] / this.imgWidth) * this.imgNaturalWidth,
      (bottomRight[1] / this.imgHeight) * this.imgNaturalHeight
    ];
    const zoomAreaInfo: ZoomAreaInfo = {
      zoomToPhotoId: 'replace me',
      zoomFromPhotoId: this.photoInfo.photoIdName,
      topLeftNaturalCoords,
      bottomRightNaturalCoords,
      naturalImgWidth: this.imgNaturalWidth,
      naturalImgHeight: this.imgNaturalHeight,
    };
    this.openDialogForZoomToPhoto(Object.assign({}, zoomAreaInfo)).subscribe((result) => {
      console.log('result', result);
      if (result) {
        // User pressed OK.
        zoomAreaInfo.zoomToPhotoId = result;
        this.putZoomAreaInScene(zoomAreaInfo);
      }
    });
  }

  putZoomAreaInScene(zoomAreaInfo: ZoomAreaInfo): void {
    if (!this.zoomAreasContainer) {
      throw new Error('No #zoomAreasContainer found in view');
    }
    const factory = this.resolver.resolveComponentFactory(ZoomAreaComponent);
    const componentRef = this.zoomAreasContainer.createComponent(factory);
    this.zoomAreaComponentsToDestroy.push(componentRef);
    componentRef.instance.zoomAreaInfo = zoomAreaInfo;
    if (!this.img) {
      throw new Error('No image data loaded in makeNewZoomArea subscription');
    }
    componentRef.instance.updateLocationAndDimensions(this.img);
    this.addZoomArea.emit(zoomAreaInfo);
    componentRef.instance.zoomInSignal.subscribe((photoToZoomTo: string) => {
      this.zoomIn.emit(photoToZoomTo);
    });
  };

  openDialogForZoomToPhoto(zoomAreaInfo: ZoomAreaInfo): Observable<string> {
    const dialogRef = this.dialog.open(ZoomAreaDialogComponent, {
      data: zoomAreaInfo,
    });

    return dialogRef.afterClosed();
  }

  resetZoomInfo(): void {
    this.zoomStart = [-1, -1];
    this.zoomDragPoint = [-1, -1];
  }

  adjustCoordinatesToImageHeight(): void {
    if (!this.cabinetImage) {
      throw new Error('No #cabinetImage found in view');
    }
    const img: HTMLImageElement = this.cabinetImage.element.nativeElement;
    this.img = img;
    this.imgNaturalWidth = img.naturalWidth;
    this.imgNaturalHeight = img.naturalHeight;
    this.imgWidth = img.clientWidth;
    this.imgHeight = img.clientHeight;
  }
}
