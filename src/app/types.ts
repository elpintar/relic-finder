export enum CanonizationStatus {
  Saint = 'St.',
  Blessed = 'Bl.',
  Venerable = 'Ven.',
  ServantOfGod = 'S.o.G.',
  Unknown = '',
}

export interface PhotoInfo {
  photoIdName: string;
  naturalImgWidth: number;
  naturalImgHeight: number;
  photoImgPath?: string;
  relicsInPhoto?: number[];
}

export interface ZoomArea {
  zoomToPhotoId: string;
  zoomFromPhotoId: string;
  // Values below are for the "zoom from" photo.
  topLeftNaturalCoords: number[];
  bottomRightNaturalCoords: number[];
  firebaseDocId?: string;
}

export interface Relic {
  inPhoto: string;
  photoNaturalCoords: number[];
  saints: Saint[];
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
}

export interface User {
  uid: string;
  name: string;
}
