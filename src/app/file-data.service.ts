import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';

interface SpreadsheetRow {
  loc1: string;
  loc2: string;
  loc3: string;
  loc4: string;
  loc5: string;
  name: string;
  vocations: string;
  otherInfo: string;
  relicMaterials: string;
  feastDayAndMonth: string;
  page: string;
  line: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileDataService {
  relicSpreadsheetData: {}[] = [];

  constructor(private http: HttpClient) { }

  getTextFile(filename: string) {
    return this.http.get(filename, {responseType: 'text'})
      .pipe(
        tap( // Log the result or error
          data => console.log(filename, data),
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
      [heads[i] || `extra_${i}`]: (cur.length > 0) ? (Number(cur) || cur) : null
    }), {}));
  }

  // ab2str(buf: ArrayBuffer): string {
  //   var enc = new TextDecoder("utf-8");
  //   return enc.decode(buf);
  // }

  fetchCsvData(callback: () => void): void {
    this.getTextFile('/assets/infoFromSaintsAndBlesseds.txt').subscribe(
      (csvText: string) => {
        const headers = ['loc1', 'loc2', 'loc3', 'loc4', 'loc5','name',
        'vocations', 'otherInfo', 'relicMaterials', 'feastDayAndMonth',
        'page', 'line'];
        this.relicSpreadsheetData = this.csvToJson(csvText, headers);
        callback();
      });

    
    // var oReq = new XMLHttpRequest();
    // oReq.onload = function(e) {
    //   csvText = ab2str(oReq.response as ArrayBuffer);
    //   return csvJsonObjs;
    // }
    // oReq.open("GET", '/assets/infoFromSaintsAndBlesseds.txt');
    // oReq.responseType = "arraybuffer";
    // oReq.send();
  }

}