import { Component, OnInit, Inject } from '@angular/core';
import { ZoomAreaInfo } from 'src/app/types';
import { assertNotNull } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-zoom-area',
  templateUrl: './zoom-area.component.html',
  styleUrls: ['./zoom-area.component.sass']
})
export class ZoomAreaComponent implements OnInit {
  zoomAreaInfo?: ZoomAreaInfo;
  width = 0;
  height = 0;
  offsetX = 0;
  offsetY = 0;

  constructor() {
  }

  updateLocationAndDimensions(img: HTMLImageElement): void {
    if (!this.zoomAreaInfo) {
      throw new Error('zoomAreaInfo not defined in ZoomAreaComponent');
    }
    const topLeft = this.zoomAreaInfo.topLeftNaturalCoords;
    const bottomRight = this.zoomAreaInfo.bottomRightNaturalCoords;
    const naturalWidth = this.zoomAreaInfo.naturalImgWidth;
    const naturalHeight = this.zoomAreaInfo.naturalImgHeight;
    this.width = (bottomRight[0] - topLeft[0]) * (img.clientWidth / naturalWidth);
    this.height = (bottomRight[1] - topLeft[1]) * (img.clientHeight / naturalHeight);
    this.offsetX = (document.body.clientWidth / 2 - img.clientWidth / 2) + topLeft[0] * (img.clientWidth / naturalWidth);
    this.offsetY = (document.body.clientHeight / 2 - img.clientHeight / 2) + topLeft[1] * (img.clientHeight / naturalHeight);
  }

  ngOnInit(): void {
  }

}
