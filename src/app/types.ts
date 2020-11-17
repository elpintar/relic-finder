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
}

export interface ZoomArea {
  zoomToPhotoFilename: string;
  zoomFromPhotoFilename: string;
  // Values below are for the "zoom from" photo.
  topLeftNaturalCoords: number[];
  bottomRightNaturalCoords: number[];
  firebaseDocId?: string; // doc in Firebase
}

export interface Relic {
  inPhoto: string;
  photoNaturalCoords: number[];
  saintFirebaseDocIds: string[];
  firebaseDocId?: string; // doc in Firebase
  relicMaterials?: string[];
  chapelLocation?: string;
  otherInfo?: string;
  docNumber?: number; // from "Doc. No." column
  numNamesInDoc?: number; // from column next to "Doc. No."
}

export interface Saint {
  name: string;
  canonizationStatus: CanonizationStatus;
  city?: string;
  subtitle?: string; // like "of the Cross"
  feastDayAndMonth?: string;
  feastDayAndMonthOld?: string;
  birthDate?: string;
  deathDate?: string;
  vocations?: string[];
  religiousOrder?: string;
  shortBio?: string;
  linkTexts?: string[];
  linkUrls?: string[];
  firebaseDocId?: string; // doc in Firebase
}

export interface User {
  uid: string;
  name: string;
}

export type RelicAndSaints = [Relic, Saint[]];
