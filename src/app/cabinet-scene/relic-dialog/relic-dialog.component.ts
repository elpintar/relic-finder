import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Relic, ZoomArea, CanonizationStatus, Saint } from 'src/app/types';

@Component({
  selector: 'app-relic-dialog',
  templateUrl: './relic-dialog.component.html',
  styleUrls: ['./relic-dialog.component.sass']
})
export class RelicDialogComponent {
  relic: Relic;
  canonizationStatuses: string[];

  constructor(
    public dialogRef: MatDialogRef<RelicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public relicInput: Relic) {
    this.relic = relicInput;
    this.canonizationStatuses = Object.values(CanonizationStatus);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  addVocation(saint: Saint): void {
    if (saint.vocations) {
      saint.vocations?.push('');
    } else {
      saint.vocations = [''];
    }
  }

  removeVocation(saint: Saint): void {
    if (saint.vocations && saint.vocations.length > 1) {
      saint.vocations.pop();
    }
  }

  addRelicMaterial(): void {
    if (this.relic.relicMaterials) {
      this.relic.relicMaterials.push('');
    } else {
      this.relic.relicMaterials = [''];
    }
  }

  removeRelicMaterial(): void {
    if (this.relic.relicMaterials && this.relic.relicMaterials.length > 1) {
      this.relic.relicMaterials.pop();
    }
  }

  addSaint(): void {
    const emptySaint = {name: '', canonizationStatus: CanonizationStatus.Unknown};
    if (this.relic.saints) {
      this.relic.saints.push(emptySaint);
    } else {
      this.relic.saints = [emptySaint];
    }
  }

  removeSaint(saint: Saint): void {
    const i = this.relic.saints.findIndex((s) => s.name === saint.name);
    this.relic.saints.splice(i, 1);
  }
}
