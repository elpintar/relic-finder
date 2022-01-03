import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { SpreadsheetRow } from './types';

@Injectable({
  providedIn: 'root'
})
export class FileDataService {
  cleanSpreadsheetData: SpreadsheetRow[] = [];

  constructor(private http: HttpClient) { }

  getTextFile(filename: string) {
    return this.http.get(filename, {responseType: 'text'})
      .pipe(
        tap( // Log the result or error
          _data => console.log("GOT", filename),
          error => console.error(filename, error)
        )
      );
  }

  // From https://stackoverflow.com/questions/59218548/what-is-the-best-way-to-convert-from-csv-to-json-when-commas-and-quotations-may/59219146#59219146
  /**
   * Takes a raw CSV string and converts it to a JavaScript object.
   * @param {string} string The raw CSV string.
   * @param {string[]} headers An optional array of headers to use. If none are
   * given, they are pulled from the file.
   * @param {string} quoteChar A character to use as the encapsulating character.
   * @param {string} delimiter A character to use between columns.
   * @returns {object[]} An array of JavaScript objects containing headers as keys
   * and row entries as values.
   */
  private csvToJson(csvString: string, headers: string[], quoteChar = '"', delimiter = ','): {}[] {
    const regex = new RegExp(`\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`, 'gs');
    const match = (line: string) => {
      return [...line.matchAll(regex)].map(match => match[2])
      .filter((_, i, a) => i < a.length - 1); // cut off blank match at end
    }

    const lines = csvString.split('\n');
    const heads = headers || match(lines.splice(0, 1)[0]);

    return lines.map(line => match(line).reduce((acc, cur, i) => ({
      ...acc,
      [heads[i] || `extra_${i}`]: (cur.length > 0) ? (Number(cur) || cur) : undefined
    }), {}));
  }

  fetchCsvData(callback: () => void): void {
    this.getTextFile('/assets/infoFromSaintsAndBlesseds.txt').subscribe(
      (csvText: string) => {
        const headers = ['loc1', 'loc2', 'loc3', 'loc4', 'loc5','name',
        'vocations', 'otherInfo', 'relicMaterials', 'feastDayAndMonth',
        'page', 'line'];
        const rawSpreadsheetData = 
          this.csvToJson(csvText, headers) as SpreadsheetRow[];
        this.cleanSpreadsheetData =
          this.cleanUpSpreadsheetData(rawSpreadsheetData);
        callback();
      });
  }

  private capitalizeFirstLetters(s: string): string {
    const words = s.split(" ");
    const upperWords = words.map((word) => { 
      return word[0].toUpperCase() + word.substring(1).toLowerCase(); 
    });
    const lowerThese = ["Of", "The", "De"]
    const betterWords = upperWords.map((word) => {
      if (lowerThese.indexOf(word) >= 0) {
        return word.toLowerCase();
      } else {
        return word;
      }
    });
    return betterWords.join(" ");
  }

  private extractReligiousOrder(s: string, row: SpreadsheetRow): string {
    const religiousOrders = ["SJ", "OFM", "OP", "OSB", "CP", "OSA", "CSSR", 
      "O.C.", "OC"];
    const words = s.split(" ");
    let lastWord = words[words.length-1];
    if (religiousOrders.indexOf(lastWord) >= 0) {
      row.religiousOrder = words.pop();
      s = words.join(" ");
      // Delete comma at end of name, if it exists.
      s = s.replace(/,$/g, "");
    }
    return s;
  }

  cleanUpSpreadsheetData(rawData: SpreadsheetRow[]): SpreadsheetRow[] {
    return rawData.map((row) => {
      if (row.name) {
        // Get rid of extra whitespace.
        row.name = row.name.replace(/  +/g, ' ').trim();
        row.name = this.extractReligiousOrder(row.name, row);
        row.name = this.capitalizeFirstLetters(row.name);
      }
      if (row.vocations) {
        // Get rid of extra whitespace.
        row.vocations = row.vocations.replace(/  +/g, ' ').trim();
        row.vocations = this.extractReligiousOrder(row.vocations, row);
        row.vocations = row.vocations.replace(/MRT/g, "Martyr");
        row.vocations = this.capitalizeFirstLetters(row.vocations);
        if (row.vocations.toLowerCase() === "blank") {
          row.vocations = undefined;
        }
      }
      if (row.relicMaterials) {
        // Get rid of extra whitespace.
        row.relicMaterials = row.relicMaterials.replace(/  +/g, ' ').trim();
        row.relicMaterials = row.relicMaterials[0].toUpperCase() +
                             row.relicMaterials.substring(1).toLowerCase();
        const osss = ["Ex oss", "Ex ossibus", "Oss", "Bone"];
        if (osss.indexOf(row.relicMaterials) >= 0) {
          row.relicMaterials = "Ex ossibus (from the bone)";
        }
      }
      if (row.feastDayAndMonth) {
        // Get rid of extra whitespace.
        row.feastDayAndMonth = row.feastDayAndMonth.replace(/  +/g, ' ').trim(); 
        if (row.feastDayAndMonth === "00-00") {
          row.feastDayAndMonth = undefined;
        }
      }
      if (row.otherInfo) {
        row.otherInfo = row.otherInfo.replace(/  +/g, ' ').trim();
      }

      return row;
    });
  }

}