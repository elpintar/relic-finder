import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentRef, HostListener } from '@angular/core';
import {PhotoInfo, ZoomArea, Relic, CanonizationStatus, Saint, RelicAndSaints} from '../types';
import { ZoomAreaComponent } from './zoom-area/zoom-area.component';
import { MatDialog } from '@angular/material/dialog';
import { ZoomAreaDialogComponent } from './zoom-area-dialog/zoom-area-dialog.component';
import { Subscription, Observable, Subject } from 'rxjs';
import { RelicDotComponent } from './relic-dot/relic-dot.component';
import { assertNotNull } from '@angular/compiler/src/output/output_ast';
import { RelicDialogComponent } from './relic-dialog/relic-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { FirebaseDataService } from '../firebase-data.service';

@Component({
  selector: 'app-cabinet-scene',
  templateUrl: './cabinet-scene.component.html',
  styleUrls: ['./cabinet-scene.component.sass']
})
export class CabinetSceneComponent implements OnInit {
  @Input() photoInfo: PhotoInfo;
  @Input() editMode = false;
  @Input() addRelicMode = false;
  @Input() hideLabels = false;

  @Output() zoomIn = new EventEmitter<string>();
  @Output() addZoomArea = new EventEmitter<ZoomArea>();
  @Output() addOrUpdateRelicDot = new EventEmitter<RelicAndSaints>();
  @Output() sceneImgChanged = new EventEmitter<void>();

  @ViewChild('cabinetImage', {read: ViewContainerRef}) cabinetImage?: ViewContainerRef;
  @ViewChild('relicDotsContainer', {read: ViewContainerRef}) relicDotsContainer?: ViewContainerRef;
  @ViewChild('zoomAreasContainer', {read: ViewContainerRef}) zoomAreasContainer?: ViewContainerRef;

  photoDirectory = '/assets/pics/';

  zoomStart = [-1, -1];

  relicDotComponentsToDestroy: ComponentRef<RelicDotComponent>[] = [];
  zoomAreaComponentsToDestroy: ComponentRef<ZoomAreaComponent>[] = [];

  img?: HTMLImageElement;
  imgNaturalWidth = 0;
  imgNaturalHeight = 0;
  imgClientWidth = 0;
  imgClientHeight = 0;

  private sceneRedrawn = new Subject();

  constructor(private resolver: ComponentFactoryResolver,
              private dialog: MatDialog,
              private firebaseDataService: FirebaseDataService) {
    this.photoInfo = {
      photoFilename: '',
      naturalImgWidth: -1,
      naturalImgHeight: -1
    };
  }

  ngOnInit(): void {
    const photoId = this.photoInfo.photoFilename;
    if (!photoId) {
      throw new Error('No photo id assigned to cabinetSceneComponent!');
    }
    if (!this.photoInfo.photoImgPath) {
      this.photoInfo.photoImgPath = this.photoDirectory + photoId + '.jpg';
    }

  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.onImgChange();
  }

  onImgChange(): void {
    this.adjustCoordinatesToImageHeight();
    // This will call redrawScene through the AppComponent controller.
    this.sceneImgChanged.emit();
  }

  redrawScene(relicsInScene: Relic[], zoomAreasInScene: ZoomArea[]): void {
    // Signal to destroy subscribers.
    this.sceneRedrawn.next();
    // Destroy dead components / html elements.
    this.zoomAreaComponentsToDestroy.forEach((zoomAreaComponent) => {
      zoomAreaComponent.destroy();
    });
    this.relicDotComponentsToDestroy.forEach((relicDotComponent) => {
      relicDotComponent.destroy();
    });
    // Redraw relics and zoom areas for this scene.
    relicsInScene.forEach((relic) => {
      const saints = this.firebaseDataService.getSaintsForRelic(relic);
      this.putRelicInScene([relic, saints]);
    });
    zoomAreasInScene.forEach((zoomArea) => {
      this.putZoomAreaInScene(zoomArea);
    });
  }

  clickInCabinet(event: MouseEvent): void {
    if (this.editMode) {
      if (this.addRelicMode) {
        this.addRelic([event.offsetX, event.offsetY]);
      } else {
        this.updateZoomAreaCoords([event.offsetX, event.offsetY]);
      }
    } else {
      // TODO - view mode
    }
  }

  addRelic(coords: [number, number]): void {
    console.log('adding relic at', coords);
    this.makeNewRelicFromCoords(coords);
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

  makeNewRelicFromCoords(coords: [number, number]): void {
    const naturalCoords = [
      (coords[0] / this.imgClientWidth) * this.photoInfo.naturalImgWidth,
      (coords[1] / this.imgClientHeight) * this.photoInfo.naturalImgHeight
    ];
    const relic: Relic = {
      inPhoto: this.photoInfo.photoFilename,
      photoNaturalCoords: naturalCoords,
      saintFirebaseDocIds: [''],
    };
    const saints: Saint[] = [{
      name: '',
      canonizationStatus: CanonizationStatus.Saint,
      firebaseDocId: '',
    }];
    this.openDialogForNewRelicInfo([relic, saints]).subscribe((returnedRelicAndSaints: [Relic, Saint[]]) => {
      console.log('result', returnedRelicAndSaints);
      if (returnedRelicAndSaints) {
        // User pressed OK.
        this.putRelicInScene(returnedRelicAndSaints, true);
      }
    });
  }

  makeNewZoomAreaFromCoords(topLeft: number[], bottomRight: number[]): void {
    if (!this.img) {
      throw new Error('No image data loaded in makeNewZoomArea');
    }
    const topLeftNaturalCoords = [
      (topLeft[0] / this.imgClientWidth) * this.photoInfo.naturalImgWidth,
      (topLeft[1] / this.imgClientHeight) * this.photoInfo.naturalImgHeight
    ];
    const bottomRightNaturalCoords = [
      (bottomRight[0] / this.imgClientWidth) * this.photoInfo.naturalImgWidth,
      (bottomRight[1] / this.imgClientHeight) * this.photoInfo.naturalImgHeight
    ];
    const zoomAreaInfo: ZoomArea = {
      zoomToPhotoFilename: 'replace me',
      zoomFromPhotoFilename: this.photoInfo.photoFilename,
      topLeftNaturalCoords,
      bottomRightNaturalCoords,
    };
    this.openDialogForZoomToPhoto(Object.assign({}, zoomAreaInfo)).subscribe((result) => {
      console.log('result', result);
      if (result) {
        // User pressed OK.
        zoomAreaInfo.zoomToPhotoFilename = result;
        this.putZoomAreaInScene(zoomAreaInfo, true);
      }
    });
  }

  putRelicInScene(relicAndSaints: RelicAndSaints, isNewRelic = false): void {
    if (!this.relicDotsContainer) {
      throw new Error('No #relicDotsContainer found in view');
    }
    const factory = this.resolver.resolveComponentFactory(RelicDotComponent);
    const componentRef = this.relicDotsContainer.createComponent(factory);
    this.relicDotComponentsToDestroy.push(componentRef);
    componentRef.instance.relic = relicAndSaints[0];
    componentRef.instance.saints = relicAndSaints[1];
    if (!this.img) {
      throw new Error('No image data loaded in makeNewZoomArea subscription');
    }
    componentRef.instance.updateLocation(this.img, this.photoInfo);
    if (isNewRelic) {
      this.addOrUpdateRelicDot.emit(relicAndSaints);
    }
    componentRef.instance.relicClickedSignal
      .pipe(takeUntil(this.sceneRedrawn))
      .subscribe(this.relicClicked.bind(this));
  }

  relicClicked(relicAndSaintsClicked: RelicAndSaints): void {
    console.log('relic clicked:', relicAndSaintsClicked);
    if (this.editMode) {
      const relicAndSaintsLatest = this.firebaseDataService
        .getLatestRelicAndSaints(relicAndSaintsClicked);
      this.openDialogForNewRelicInfo(relicAndSaintsLatest)
      .subscribe((returnedRelicAndSaints: RelicAndSaints) => {
        if (returnedRelicAndSaints) {
          // User pressed OK.
          this.addOrUpdateRelicDot.emit(returnedRelicAndSaints);
        }
    });
    }
  }

  putZoomAreaInScene(zoomAreaInfo: ZoomArea, isNewZoomArea = false): void {
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
    componentRef.instance.updateLocationAndDimensions(this.img, this.photoInfo);
    if (isNewZoomArea) {
      this.addZoomArea.emit(zoomAreaInfo);
    }
    componentRef.instance.zoomInSignal
      .pipe(takeUntil(this.sceneRedrawn))
      .subscribe((photoToZoomTo: string) => {
        // Zoom in to this photo (in edit or view mode).
        this.zoomIn.emit(photoToZoomTo);
      });
  }

  openDialogForNewRelicInfo(relicAndSaints: RelicAndSaints): Observable<[Relic, Saint[]]> {
    const dialogRef = this.dialog.open(RelicDialogComponent, {
      data: relicAndSaints,
    });

    return dialogRef.afterClosed();
  }

  openDialogForZoomToPhoto(zoomAreaInfo: ZoomArea): Observable<string> {
    const dialogRef = this.dialog.open(ZoomAreaDialogComponent, {
      data: zoomAreaInfo,
    });

    return dialogRef.afterClosed();
  }

  resetZoomInfo(): void {
    this.zoomStart = [-1, -1];
  }

  adjustCoordinatesToImageHeight(photoInfo?: PhotoInfo): void {
    if (!this.cabinetImage) {
      throw new Error('No #cabinetImage found in view');
    }
    if (false && photoInfo) {// && photoInfo.photoImgPath) {
      // this.img = document.createElement('img');
      // this.img.src = photoInfo.photoImgPath;
      // this.img.onload = function(){
      //   this.img.style.visibility = 'hidden';
      //   document.body.appendChild(img);
      //   console.log(img.clientWidth);
      // }
      // this.photoInfo.naturalImgWidth = img.naturalWidth;
      // this.photoInfo.naturalImgHeight = img.naturalHeight;
      // this.imgClientWidth = img.clientWidth;
      // this.imgClientHeight = img.clientHeight;
    } else {
      const img: HTMLImageElement = this.cabinetImage.element.nativeElement;
      this.img = img;
      this.photoInfo.naturalImgWidth = img.naturalWidth;
      this.photoInfo.naturalImgHeight = img.naturalHeight;
      this.imgClientWidth = img.clientWidth;
      this.imgClientHeight = img.clientHeight;
    }
  }
}
