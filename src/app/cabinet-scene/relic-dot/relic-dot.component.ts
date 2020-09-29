import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PhotoInfo, Relic } from 'src/app/types';

@Component({
  selector: 'app-relic-dot',
  templateUrl: './relic-dot.component.html',
  styleUrls: ['./relic-dot.component.sass']
})
export class RelicDotComponent implements OnInit {
  @Output() relicClickedSignal = new EventEmitter<Relic>();

  relic?: Relic;
  offsetX = -1;
  offsetY = -1;

  sendRelicClickedSignal(): void {
    if (!this.relic) {
      throw new Error('relic not defined in sendRelicClickedSignal');
    }
    this.relicClickedSignal.emit(this.relic);
  }

  updateLocation(img: HTMLImageElement, photoInfo: PhotoInfo): void {
    if (!this.relic) {
      throw new Error('relic not defined in RelicDotComponent');
    }
    const coords = this.relic.photoNaturalCoords;
    const naturalWidth = photoInfo.naturalImgWidth;
    const naturalHeight = photoInfo.naturalImgHeight;
    this.offsetX = (document.body.clientWidth / 2 - img.clientWidth / 2) + coords[0] * (img.clientWidth / naturalWidth);
    this.offsetY = (document.body.clientHeight / 2 - img.clientHeight / 2) + coords[1] * (img.clientHeight / naturalHeight);
  }

  ngOnInit(): void {
  }

}
