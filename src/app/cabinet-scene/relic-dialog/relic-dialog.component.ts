import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Relic, ZoomAreaInfo } from 'src/app/types';

@Component({
  selector: 'app-relic-dialog',
  templateUrl: './relic-dialog.component.html',
  styleUrls: ['./relic-dialog.component.sass']
})
export class RelicDialogComponent {
  relic: Relic;

  constructor(
    public dialogRef: MatDialogRef<RelicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public relicInput: Relic) {
    this.relic = relicInput;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
