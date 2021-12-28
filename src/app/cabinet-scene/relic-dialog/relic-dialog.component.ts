import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatRadioChange, _MatRadioButtonBase } from '@angular/material/radio';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FirebaseAuthService } from 'src/app/firebase-auth.service';
import { FirebaseDataService } from 'src/app/firebase-data.service';
import { msToDate } from 'src/app/helperFuncs';
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
  otherCommonName = '';

  // Comes from injected data; determines which template to use.
  editMode = false;

  constructor(
      public dialogRef: MatDialogRef<RelicDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public dataInput: [RelicAndSaints, boolean],
      private firebaseDataService: FirebaseDataService,
      private firebaseAuthService: FirebaseAuthService) {
    dialogRef.disableClose = true;
    const relicAndSaintsInput = this.dataInput;
    this.relic = relicAndSaintsInput[0][0];
    this.saints = relicAndSaintsInput[0][1];
    this.editMode = this.dataInput[1];
    this.saints.map(this.initOtherCommonName);
    this.canonizationStatuses = Object.values(CanonizationStatus);
    this.filteredSaints = this.autocompleteSaintsCtrl.valueChanges
      .pipe(
        startWith(''),
        map(this.filterSaintsMatchingSearch, this)
      );
  }

  msToDate(ms: number): string {
    return msToDate(ms);
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

  initOtherCommonName(saint: Saint): void {
    if (saint.commonName) {
      if (saint.commonName === 'CITY' || saint.commonName === 'SUBTITLE') {
        saint.otherCommonName = '';
      } else {
        saint.otherCommonName = saint.commonName;
      }
    } else {
      saint.otherCommonName = '';
    }
  }

  saintCommonNameChanged(event: MatRadioChange, saint: Saint): void {
    saint.commonName = event.value as string;
  }

  clickRadioBtn(saint: Saint, i: number): void {
    const id = saint.name + i.toString() + 'radio-btn-input';
    const elem = document.getElementById(id);
    if (elem) {
      elem.click();
    } else {
      console.error('No radio btn elem found for id:', id);
    }
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
    const currentUser = this.firebaseAuthService.getUserName() || 'Anonymous';
    const msSince1970 = new Date().getTime();
    const emptySaint = {
      name: '', 
      canonizationStatus: CanonizationStatus.Unknown,
      editors: [currentUser],
      timesUpdated: [msSince1970],
    };
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
    if (saint.commonName) {
      if (saint.commonName === 'CITY') {
        return saint.canonizationStatus + ' ' +
          saint.name + ' of ' + saint.city;
      } else if (saint.commonName === 'SUBTITLE') {
        return saint.canonizationStatus + ' ' +
          saint.name + ' ' + saint.subtitle;
      } else {
        return saint.commonName;
      }
    }
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
