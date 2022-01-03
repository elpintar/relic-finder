export enum CanonizationStatus {
  Saint = 'St.',
  Blessed = 'Bl.',
  Venerable = 'Ven.',
  ServantOfGod = 'S.o.G.',
  Unknown = '',
}

export interface PhotoInfo {
  photoFilename: string;
  naturalImgWidth: number;
  naturalImgHeight: number;
  photoImgPath?: string;
  relicsInPhoto?: number[];
  arrows: PhotoArrows;
}

export interface ZoomArea {
  firebaseDocId?: string; // doc in Firebase
  zoomToPhotoFilename: string;
  zoomFromPhotoFilename: string;
  // Values below are for the "zoom from" photo.
  topLeftNaturalCoords: number[];
  bottomRightNaturalCoords: number[];
}

export interface PhotoArrows {
  firebaseDocId?: string; // doc in Firebase = photoFilename + '-arrows'
  photoFilename: string; // must match filenames in zoom area data
  leftToPhoto?: string; // must match filenames in zoom area data
  rightToPhoto?: string; // must match filenames in zoom area data
  upToPhoto?: string; // must match filenames in zoom area data
  downToPhoto?: string; // must match filenames in zoom area data
}

export interface Relic {
  firebaseDocId?: string; // doc in Firebase
  inPhoto: string;
  photoNaturalCoords: number[];
  saintFirebaseDocIds: string[];
  relicMaterials?: string[];
  chapelLocation?: string;
  otherInfo?: string;
  bookPage?: number; // what page in the Saints & Blesseds book
  bookLine?: number; // what line on Saints & Blesseds book page
  docNumber?: number; // from "Doc. No." column
  numNamesInDoc?: number; // from column next to "Doc. No."
  creator?: string; // DEPRECATED - name of first user who created relic
  editors: string[]; // name of users who created/edited in order
  timesUpdated: number[]; // Date.getTime() values; maps 1-to-1 with editors
                          // 0 means we don't know when updated
}

export interface Saint {
  firebaseDocId?: string; // doc in Firebase
  name: string;
  commonName?: string; // "commonly known as" name, for relic dot label
                       // 'CITY' or 'SUBTITLE' values indicate to use the
                       // given information to compile a string
  otherCommonName?: string; // used only internally for form field,
                            // the value won't matter or need saved.
  canonizationStatus: CanonizationStatus;
  city?: string;
  subtitle?: string; // like "of the Cross"
  feastDayAndMonth?: string;
  feastDayAndMonthOld?: string;
  birthDate?: string;
  deathDate?: string;
  vocations?: string[];
  religiousOrder?: string;
  patronages?: string[]; // patron saint of [fishermen, cancer patients, etc.]
  shortBio?: string;
  linkTexts?: string[];
  linkUrls?: string[];
  editors: string[]; // name of users who edited
  timesUpdated: number[]; // Date.getTime() values; maps 1-to-1 with editors
                          // 0 means we don't know when updated
}

export interface User {
  uid: string;
  name: string;
}

export type RelicAndSaints = [Relic, Saint[]];

export interface SpreadsheetRow {
  loc1?: string;
  loc2?: string;
  loc3?: string;
  loc4?: string;
  loc5?: string;
  name?: string;
  vocations?: string;
  religiousOrder?: string;
  otherInfo?: string;
  relicMaterials?: string;
  feastDayAndMonth?: string;
  page?: string;
  line?: string;
}