import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { DisplayZoomArea, PhotoInfo, ZoomArea } from 'src/app/types';

@Component({
  selector: 'app-zoom-area',
  templateUrl: './zoom-area.component.html',
  styleUrls: ['./zoom-area.component.sass'],
})
export class ZoomAreaComponent implements OnInit {
  @Output() zoomAreaClicked = new EventEmitter<string>();

  zoomAreaInfo?: DisplayZoomArea;
  width = 0;
  height = 0;
  offsetX = 0;
  offsetY = 0;
  borderColor = 'yellow';
  relicCount: number | undefined;

  constructor() {}

  sendZoomInSignal(): void {
    if (!this.zoomAreaInfo) {
      throw new Error('zoomAreaInfo not defined in sendZoomInSignal');
    }
    this.zoomAreaClicked.emit(this.zoomAreaInfo.zoomToPhotoFilename);
  }

  updateLocationAndDimensions(
    img: HTMLImageElement,
    photoInfo: PhotoInfo
  ): void {
    if (!this.zoomAreaInfo) {
      throw new Error('zoomAreaInfo not defined in ZoomAreaComponent');
    }
    const topLeft = this.zoomAreaInfo.topLeftNaturalCoords;
    const bottomRight = this.zoomAreaInfo.bottomRightNaturalCoords;
    const naturalWidth = photoInfo.naturalImgWidth;
    const naturalHeight = photoInfo.naturalImgHeight;
    this.width =
      (bottomRight[0] - topLeft[0]) * (img.clientWidth / naturalWidth);
    this.height =
      (bottomRight[1] - topLeft[1]) * (img.clientHeight / naturalHeight);
    this.offsetX =
      document.body.clientWidth / 2 -
      img.clientWidth / 2 +
      topLeft[0] * (img.clientWidth / naturalWidth);
    this.offsetY =
      document.body.clientHeight / 2 -
      img.clientHeight / 2 +
      topLeft[1] * (img.clientHeight / naturalHeight);
  }

  ngOnInit(): void {
    if (this.zoomAreaInfo) {
      this.borderColor = this.zoomAreaInfo.color || 'yellow';
    }
  }
}
