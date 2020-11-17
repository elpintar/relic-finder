import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FirebaseDataService } from 'src/app/firebase-data.service';
import { Relic, ZoomArea, CanonizationStatus, Saint, RelicAndSaints } from 'src/app/types';

@Component({
  selector: 'app-relic-dialog',
  templateUrl: './relic-dialog.component.html',
  styleUrls: ['./relic-dialog.component.sass']
})
export class RelicDialogComponent {
  relic: Relic;
  saints: Saint[];
  canonizationStatuses: string[];
  autocompleteSaintsCtrl = new FormControl();
  filteredSaints: Observable<Saint[]>;

  constructor(
      public dialogRef: MatDialogRef<RelicDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public relicAndSaintsInput: RelicAndSaints,
      private firebaseDataService: FirebaseDataService) {
    dialogRef.disableClose = true;
    this.relic = relicAndSaintsInput[0];
    this.saints = relicAndSaintsInput[1];
    this.canonizationStatuses = Object.values(CanonizationStatus);
    this.filteredSaints = this.autocompleteSaintsCtrl.valueChanges
      .pipe(
        startWith(''),
        map(this.filterSaintsMatchingSearch, this)
      );
  }

  filterSaintsMatchingSearch(searchValue: string): Saint[] {
    const copyOfAllSaints = this.firebaseDataService.allSaintsLocal.slice();
    if (searchValue) {
      const searchLowercase = searchValue.toLowerCase();
      return copyOfAllSaints.filter(s => {
        let sName = this.getHumanReadableSaintName(s);
        sName = sName.toLowerCase();
        return sName.indexOf(searchLowercase) >= 0;
      });
    } else {
      return copyOfAllSaints;
    }
  }

  autocompleteOptionSelectedForSaint(selectedSaint: Saint,
                                     saintIndex: number): void {
    // Copy the selectedSaint information to populate the form data for the
    // saint at the saintIndex.
    this.saints[saintIndex] = Object.assign({}, selectedSaint);
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
    if (saint.vocations && saint.vocations.length >= 1) {
      saint.vocations.pop();
    }
  }

  addLink(saint: Saint): void {
    if (saint.linkUrls && saint.linkTexts) {
      saint.linkUrls.push('');
      saint.linkTexts?.push('');
    } else {
      saint.linkUrls = [''];
      saint.linkTexts = [''];
    }
  }

  removeLink(saint: Saint): void {
    if (saint.linkUrls && saint.linkUrls.length >= 1) {
      saint.linkUrls.pop();
    }
    if (saint.linkTexts && saint.linkTexts.length >= 1) {
      saint.linkTexts.pop();
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
    if (this.relic.relicMaterials && this.relic.relicMaterials.length >= 1) {
      this.relic.relicMaterials.pop();
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

  getHumanReadableSaintName(saint: Saint): string {
    let saintName = saint.name;
    saintName = saint.canonizationStatus + ' ' + saint.name;
    if (saint.subtitle) {
      saintName = saintName + ' ' + saint.subtitle;
    }
    if (saint.city) {
      saintName = saintName + ' of ' + saint.city;
    }
    if (saint.religiousOrder) {
      saintName = saintName + ', ' + saint.religiousOrder;
    }
    return saintName;
  }

  getHumanReadableSaintVocations(saint: Saint): string {
    if (saint.vocations) {
      return saint.vocations?.join(', ');
    } else {
      return '';
    }
  }
}
