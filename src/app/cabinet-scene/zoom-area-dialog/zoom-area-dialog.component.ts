import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ZoomAreaInfo } from 'src/app/types';

@Component({
  selector: 'app-zoom-area-dialog',
  templateUrl: './zoom-area-dialog.component.html',
  styleUrls: ['./zoom-area-dialog.component.sass']
})
export class ZoomAreaDialogComponent {
  newZoomToPhotoId = '';

  constructor(
    public dialogRef: MatDialogRef<ZoomAreaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ZoomAreaInfo) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
