export interface PhotoInfo {
  photoIdName: string;
  photoImgPath?: string;
  relicsInPhoto?: number[];
  zoomAreasInPhoto?: string[];
}

export interface ZoomAreaInfo {
  zoomToPhotoId: string;
  zoomFromPhotoId: string;
  // Values below are for the "zoom from" photo.
  topLeftNaturalCoords: number[];
  bottomRightNaturalCoords: number[];
  naturalImgWidth: number;
  naturalImgHeight: number;
}

export interface Relic {
  relicId: number;
  saint: Saint;
  inPhoto: string;
  photoCoords: number[];
  relicMaterial?: string;
  chapelLocation?: string;
  additionalInfo?: string;
}

export interface Saint {
  name: string;
  feastDayAndMonth?: string;
  vocation?: string;
}
