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
  saints: Saint[];
  canonizationStatuses: string[];

  constructor(
    public dialogRef: MatDialogRef<RelicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public relicAndSaintsInput: [Relic, Saint[]]) {
    this.relic = relicAndSaintsInput[0];
    this.saints = relicAndSaintsInput[1];
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

  onRelicMaterialUpdate(newValue: string, i: number): void {
    console.log(newValue, i);
    if (this.relic.relicMaterials && this.relic.relicMaterials.length >= (i + 1)) {
      this.relic.relicMaterials[i] = newValue;
    }
  }

  // Without this function the input was losing focus on every keypress.
  trackByFn(index: number): number {
    return index;
  }

  addSaint(): void {
    const emptySaint = {name: '', canonizationStatus: CanonizationStatus.Unknown};
    if (this.saints) {
      this.saints.push(emptySaint);
    } else {
      this.saints = [emptySaint];
    }
  }

  removeSaint(saint: Saint): void {
    const i = this.saints.findIndex((s) => s.name === saint.name);
    this.saints.splice(i, 1);
  }
}
