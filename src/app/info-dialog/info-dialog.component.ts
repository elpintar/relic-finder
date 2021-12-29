import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FirebaseDataService } from '../firebase-data.service';
import { Relic, Saint } from '../types';

interface UserScoreboardInfo {
  relicsCreated: number;
  relicsUpdated: number;
  saintsCreated: number;
  saintsUpdated: number;
};

type ScoreboardInfoKey = 'relicsCreated'|'relicsUpdated'|
                         'saintsCreated'|'saintsUpdated';

@Component({
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.sass']
})
export class InfoDialogComponent {

  displayList: [string, UserScoreboardInfo][] = [];

  constructor(
    public dialogRef: MatDialogRef<InfoDialogComponent>,
    private firebaseDataService: FirebaseDataService,
  ) {
    this.calculateScoreboard();
  }

  calculateScoreboard() {
    const relics = this.firebaseDataService.allRelicsLocal;
    const saints = this.firebaseDataService.allSaintsLocal;
    const users: Map<string, UserScoreboardInfo> = new Map();

    relics.forEach((r: Relic) => {
      this.getRelicOrSaintInfo(r, users, ['relicsCreated', 'relicsUpdated']);
    });

    saints.forEach((s: Saint) => {
      this.getRelicOrSaintInfo(s, users, ['saintsCreated', 'saintsUpdated']);
    });

    const scoredList: [string, number][] = [];
    users.forEach((sbInfo, username) => {
      scoredList.push([username, this.score(sbInfo)]);
    });

    scoredList.sort(this.compareScores);

    this.displayList = [];
    
    scoredList.forEach(([username, score]) => {
      const sbInfo = users.get(username);
      if (sbInfo) {
        // Will always be sbInfo since we got the usernames from it.
        this.displayList.push([username, sbInfo]);
      }
    });
  }

  compareScores([username1, score1]: [string, number], 
                [username2, score2]: [string, number]) {
    if (score1 > score2) {
      return -1;
    } else if (score2 > score1) {
      return 1;
    } else {
      return 0;
    }
  }

  score(sbInfo: UserScoreboardInfo): number {
    return 15 * sbInfo.saintsCreated +
           10 * sbInfo.relicsCreated +
            4 * sbInfo.saintsUpdated +
            3 * sbInfo.relicsUpdated;
  }

  getRelicOrSaintInfo(rOrS: Relic|Saint, users: Map<string, UserScoreboardInfo>,
                      keysToUpdate: [ScoreboardInfoKey, ScoreboardInfoKey]) {
    const creator = rOrS.editors[0];
    this.updateInfo(users, keysToUpdate[0], creator);
    const uniqueEditors = [...new Set(rOrS.editors.slice(1))];
    uniqueEditors.forEach((ue) => {
      this.updateInfo(users, keysToUpdate[1], ue);
    });
  }

  updateInfo(users: Map<string, UserScoreboardInfo>, 
             infoKey: ScoreboardInfoKey,
             username: string) {
    const info = users.get(username);
    if (info) {
      info[infoKey] = info[infoKey] + 1;
    } else {
      const objToUpdate = {
        relicsCreated: 0,
        relicsUpdated: 0,
        saintsCreated: 0,
        saintsUpdated: 0,
      }
      objToUpdate[infoKey] = objToUpdate[infoKey] + 1;      
      users.set(username, objToUpdate);
    }
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }

}
