import { Relic, RelicAndSaints, Saint, SpreadsheetRow } from './types';

export function makeSaintNameString(saint: Saint): string {
  if (saint.commonName) {
    if (saint.commonName === 'CITY') {
      return saint.canonizationStatus + ' ' + saint.name + ' of ' + saint.city;
    } else if (saint.commonName === 'SUBTITLE') {
      return saint.canonizationStatus + ' ' + saint.name + ' ' + saint.subtitle;
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

function deepEquals(x: any, y: any) {
  if (x === y) {
    return true; // if both x and y are null or undefined and exactly the same
  } else if (!(x instanceof Object) || !(y instanceof Object)) {
    return false; // if they are not strictly equal, they both need to be Objects
  } else if (x.constructor !== y.constructor) {
    // they must have the exact same prototype chain, the closest we can do is
    // test their constructor.
    return false;
  } else {
    for (const p in x) {
      if (!x.hasOwnProperty(p)) {
        continue; // other properties were tested using x.constructor === y.constructor
      }
      if (!y.hasOwnProperty(p)) {
        return false; // allows to compare x[ p ] and y[ p ] when set to undefined
      }
      if (x[p] === y[p]) {
        continue; // if they have the same strict value or identity then they are equal
      }
      if (typeof x[p] !== 'object') {
        return false; // Numbers, Strings, Functions, Booleans must be strictly equal
      }
      if (!deepEquals(x[p], y[p])) {
        return false;
      }
    }
    for (const p in y) {
      if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
        return false;
      }
    }
    return true;
  }
}

export function relicsEqual(r1: Relic, r2: Relic) {
  return deepEquals(r1, r2);
}

export function saintsEqual(s1: Saint, s2: Saint) {
  return deepEquals(s1, s2);
}

export function relicAndSaintsEqual(rs1: RelicAndSaints, rs2: RelicAndSaints) {
  const r1 = rs1[0];
  const r2 = rs2[0];
  const saints1 = rs1[1];
  const saints2 = rs2[1];
  let allSaintsEqual = true;
  saints1.map((s1, i) => {
    allSaintsEqual = allSaintsEqual && deepEquals(s1, saints2[i]);
  });
  return deepEquals(r1, r2) && allSaintsEqual;
}

/** Turn milliseconds since 1970 to a human-readable datetime string. */
export function msToDate(ms: number): string {
  if (ms === 0) {
    return 'sometime in 2021';
  }
  const d = new Date(ms);
  let datetimeString = d.toLocaleDateString();
  datetimeString = datetimeString + ' ' + d.toLocaleTimeString();
  return datetimeString;
}

export function locsToString(row: SpreadsheetRow): string {
  let result = '' + row.loc1;
  if (row.loc2) {
    result += ' ' + row.loc2;
    if (row.loc3) {
      result += ' ' + row.loc3;
      if (row.loc4) {
        result += ' ' + row.loc4;
        if (row.loc5) {
          result += ' ' + row.loc5;
        }
      }
    }
  }
  return result;
}
