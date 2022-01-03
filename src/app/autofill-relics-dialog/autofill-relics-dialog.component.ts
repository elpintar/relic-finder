import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileDataService } from '../file-data.service';
import { SpreadsheetRow } from '../types';
import { locsToString } from '../helperFuncs';

@Component({
  selector: 'app-autofill-relics-dialog',
  templateUrl: './autofill-relics-dialog.component.html',
  styleUrls: ['./autofill-relics-dialog.component.sass']
})
export class AutofillRelicsDialogComponent {
  chapelLocation = '';
  lookupResultStr = '';
  lookupResult?: SpreadsheetRow;
  lookupIndex = -1;

  constructor(
    public dialogRef: MatDialogRef<AutofillRelicsDialogComponent>,
    private fileDataService: FileDataService,
    @Inject(MAT_DIALOG_DATA) public data: SpreadsheetRow,
  ) { }

  lookupRelicLocation(chapelLoc: string) {
    const spreadsheet = this.fileDataService.cleanSpreadsheetData;
    const searchString = chapelLoc.toUpperCase().trim();
    const results = spreadsheet.filter((row: SpreadsheetRow) => {
      let ssLoc = locsToString(row);
      return ssLoc === searchString;
    });
    if (results.length === 1) {
      this.lookupResultStr = 'Relic information found:\n\n' + 
        this.prettyPrintSpreadsheetRow(results[0]);
      this.lookupResult = results[0];
    } else if (results.length > 1) {
      this.lookupResultStr = results.length.toString() +
        ' results found...hmmm, unusual...first one will be used: \n';
      this.lookupResultStr += results
        .map((r) => this.prettyPrintSpreadsheetRow(r))
        .join('\n\n');
      this.lookupResult = results[0];
    } else {
      this.lookupResultStr = 'No relic found with location: ' + chapelLoc;
      const partialMatches = spreadsheet.filter((row: SpreadsheetRow) => {
        let ssLoc = locsToString(row);
        // Index of allows for partial matches, such as "A 1" matching "A 1 A"
        // and "A 1 B".
        return ssLoc.indexOf(searchString) === 0;
      });
      if (partialMatches.length > 0) {
        this.lookupResultStr += '\n' + partialMatches.length.toString() +
          ' partial matches found.\nDid you mean one of these?\n\n';
        this.lookupResultStr += partialMatches.map((r) => locsToString(r))
          .join('\n');
      }
    }
    this.getIndexAndRawRow();
  }

  private getIndexAndRawRow() {
    if (this.lookupResult) {
      const spreadsheet = this.fileDataService.cleanSpreadsheetData;
      this.lookupIndex = spreadsheet.findIndex((row) => {
        return locsToString(row) === locsToString(this.lookupResult!);
      });
    }
  }

  private prettyPrintSpreadsheetRow(row: SpreadsheetRow): string {
    let result = '';
    result += row.name + '\n';
    if (row.religiousOrder) {
      result += 'religious order: ' + row.religiousOrder + '\n';
    }
    if (row.vocations) {
      result += 'vocations: ' + row.vocations + '\n';
    }
    if (row.relicMaterials) {
      result += 'relic is: ' + row.relicMaterials + '\n';
    }
    if (row.feastDayAndMonth) {
      result += 'feast day: ' + row.feastDayAndMonth + '\n';
    }
    if (row.otherInfo) {
      result += 'other info: ' + row.otherInfo + '\n';
    }
    if (row.page) {
      result += 'page in book: ' + row.page + '\n';
    }
    if (row.line) {
      result += 'line in book: ' + row.line + '\n';
    }
    result += 'chapel location: ' + locsToString(row);
    return result;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
