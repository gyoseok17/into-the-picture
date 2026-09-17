export type PhotoDisplayMode = 'WITH_CONTEST' | 'PHOTO_ONLY'
export type PhotoTakenAtSource = 'EXIF' | 'MANUAL' | 'BUNDLE_START_FALLBACK'

export interface PhotoRecord {
  id: number
  url: string
  originalFilename: string | null
  contentType: string | null
  fileSize: number | null
  takenAt: string | null
  takenAtSource?: PhotoTakenAtSource | null
  placeName: string | null
  memo: string | null
  archivedAt: string | null
  contestId: number | null
  displayMode: PhotoDisplayMode
  mapRegionCode?: string | null
  mapCityCode?: string | null
  createdAt: string
}

/**
 * One story/map item. New uploads have an id and multiple photos; a prior
 * single record is deliberately represented as a legacy one-photo bundle.
 */
export interface PhotoRecordBundle {
  id: number | null
  photos: PhotoRecord[]
  takenAt: string | null
  endedAt?: string | null
  placeName: string | null
  memo: string | null
  archivedAt: string | null
  mapRegionCode: string | null
  mapCityCode: string | null
  createdAt: string
  legacy: boolean
}

/** Active-photo map response. Records without server-resolved coordinates are omitted. */
export interface PhotoRecordMapPin {
  id: number
  url: string
  originalFilename: string | null
  placeName: string
  takenAt: string | null
  lat: number
  lng: number
  mapRegionCode?: string | null
  mapCityCode?: string | null
  bundleId?: number | null
}

/** One map marker per uploaded bundle (or one legacy photo). */
export interface PhotoRecordBundleMapPin {
  id: number | null
  legacy: boolean
  photos: PhotoRecord[]
  placeName: string
  takenAt: string | null
  endedAt?: string | null
  lat: number
  lng: number
  mapRegionCode?: string | null
  mapCityCode?: string | null
  locationSource: string
  representative: boolean
}

/** 서버가 제공하는 161개 시·군의 표준 선택지와 지도 앵커다. */
export interface MapLocationCityOption {
  code: string
  label: string
  latitude: number
  longitude: number
}

export interface MapLocationRegionOption {
  code: string
  label: string
  cities: MapLocationCityOption[]
}

export interface PhotoRecordDraft {
  takenAt?: string | null
  placeName?: string | null
  memo?: string | null
  mapRegionCode?: string | null
  mapCityCode?: string | null
}

export interface PhotoRecordUpdate extends PhotoRecordDraft {
  archived?: boolean
  displayMode?: PhotoDisplayMode
}

export interface PhotoRecordUpload extends PhotoRecordDraft {
  file: File
}

export interface PhotoRecordBundleDraft extends PhotoRecordDraft {
  endedAt?: string | null
}

export interface PhotoRecordBundleUpload extends PhotoRecordBundleDraft {
  files: File[]
  /** Repeated multipart value aligned 1:1 with files; null keeps server EXIF/fallback resolution. */
  manualTakenAts?: Array<string | null>
}

export type PhotoRecordSort = 'time' | 'place'
