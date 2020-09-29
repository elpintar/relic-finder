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
}

export interface Relic {
  inPhoto: string;
  photoNaturalCoords: number[];
  saint?: Saint;
  relicMaterial?: string;
  chapelLocation?: string;
  additionalInfo?: string;
}

export interface Saint {
  name: string;
  feastDayAndMonth?: string;
  vocation?: string;
}
