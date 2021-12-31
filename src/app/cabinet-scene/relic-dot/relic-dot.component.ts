import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PhotoInfo, Relic, RelicAndSaints, Saint } from 'src/app/types';

@Component({
  selector: 'app-relic-dot',
  templateUrl: './relic-dot.component.html',
  styleUrls: ['./relic-dot.component.sass']
})
export class RelicDotComponent {
  @Output() relicClickedSignal = new EventEmitter<RelicAndSaints>();

  relic?: Relic;
  saints?: Saint[];
  offsetX = -1;
  offsetY = -1;

  sendRelicClickedSignal(): void {
    if (!this.relic) {
      throw new Error('relic not defined in sendRelicClickedSignal');
    }
    this.relicClickedSignal.emit([this.relic, this.saints || []]);
  }

  showRelicInfo(): void {
    console.log(this.relic);
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

  getHoverText(): string {
    const saints = this.saints;
    if (saints && saints.length >= 1 && saints[0]) {
      if (saints[0].commonName) {
        return this.getCommonName(saints[0]);
      } else {
        return saints[0].canonizationStatus + ' ' + saints[0].name;
      }
    } else {
      return '?';
    }
  }

  getCommonName(saint: Saint): string {
    if (saint.commonName) {
      if (saint.commonName === 'CITY') {
        return saint.canonizationStatus + ' ' + saint.name + ' of ' +
          saint.city;
      } else if (saint.commonName === 'SUBTITLE') {
        return saint.canonizationStatus + ' ' + saint.name + ' ' +
          saint.subtitle;
      } else {
        return saint.commonName;
      }
    } else {
      return saint.canonizationStatus + saint.name;
    }
  }
}
