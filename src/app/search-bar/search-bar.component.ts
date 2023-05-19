import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { Relic, Saint } from '../types';
import { map, startWith } from 'rxjs/operators';
import { FirebaseDataService } from '../firebase-data.service';
import { makeSaintNameString } from '../helperFuncs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.sass'],
})
export class SearchBarComponent {
  @Output() newSearch = new EventEmitter<Saint>();

  autocompleteSaintsCtrl = new FormControl();
  filteredSaints: Observable<Saint[]>;
  getHumanReadableSaintName: Function;

  constructor(private firebaseDataService: FirebaseDataService) {
    this.getHumanReadableSaintName = makeSaintNameString;
    this.filteredSaints = this.autocompleteSaintsCtrl.valueChanges.pipe(
      startWith(''),
      map(this.filterSaintsMatchingSearch, this)
    );
  }

  filterSaintsMatchingSearch(searchValue: string): Saint[] {
    const copyOfAllSaints = this.firebaseDataService.allSaintsLocal.slice();
    if (searchValue) {
      const searchLowercase = searchValue.toLowerCase();
      return copyOfAllSaints.filter((s) => {
        let sName = this.getHumanReadableSaintName(s);
        sName = sName.toLowerCase();
        return sName.indexOf(searchLowercase) >= 0;
      });
    } else {
      return copyOfAllSaints;
    }
  }

  autocompleteOptionSelectedForSaint(selectedSaint: Saint): void {
    this.newSearch.emit(selectedSaint);
  }
}
