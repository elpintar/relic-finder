import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PhotoArrows } from 'src/app/types';

@Component({
  selector: 'app-arrow-dialog',
  templateUrl: './arrow-dialog.component.html',
  styleUrls: ['./arrow-dialog.component.sass'],
})
export class ArrowDialogComponent {
  newArrowToPhotoFilename = '';

  constructor(
    public dialogRef: MatDialogRef<ArrowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhotoArrows
  ) {
    dialogRef.disableClose = true;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}
