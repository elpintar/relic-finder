export interface PhotoInfo {
  photoIdName: string;
  photoImgPath?: string;
  relicsInPhoto?: number[];
  photosInPhoto?: string[];
}

export interface Relic {
  relicId: number;
  saint: Saint;
  relicMaterial?: string;
  chapelLocation?: string;
  additionalInfo?: string;
}

export interface Saint {
  name: string;
  feastDayAndMonth?: string;
  vocation?: string;
}