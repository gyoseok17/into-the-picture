import { apiClient } from '@/lib/apiClient'
import type {
  PhotoRecord,
  PhotoRecordBundle,
  PhotoRecordBundleUpload,
  PhotoRecordMapPin,
  PhotoRecordBundleMapPin,
  PhotoRecordUpdate,
  PhotoRecordUpload,
  MapLocationRegionOption,
} from './types'

/** Keeps an automatic per-file date slot from being collapsed by multipart binding. */
const AUTOMATIC_TAKEN_AT = '__AUTO__'

export async function fetchPhotoRecords(
  archived = false,
): Promise<PhotoRecord[]> {
  const { data } = await apiClient.get<PhotoRecord[]>('/me/photos', {
    params: { archived },
  })
  return data
}

export async function fetchPhotoRecordBundles(
  archived = false,
): Promise<PhotoRecordBundle[]> {
  const { data } = await apiClient.get<PhotoRecordBundle[]>('/me/photos/bundles', {
    params: { archived },
  })
  return data
}

export async function fetchPhotoRecordMap(): Promise<PhotoRecordMapPin[]> {
  const { data } = await apiClient.get<PhotoRecordMapPin[]>('/me/photos/map')
  return data
}

export async function fetchPhotoRecordBundleMap(): Promise<PhotoRecordBundleMapPin[]> {
  const { data } = await apiClient.get<PhotoRecordBundleMapPin[]>('/me/photos/bundles/map')
  return data
}

export async function setPhotoRecordMapRepresentative(photoRecordId: number): Promise<void> {
  await apiClient.put('/me/photos/map/representative', { photoRecordId })
}

export async function fetchMapLocationOptions(): Promise<MapLocationRegionOption[]> {
  const { data } = await apiClient.get<MapLocationRegionOption[]>('/me/photos/map/locations')
  return data
}

export async function uploadPhotoRecord({
  file,
  takenAt,
  placeName,
  memo,
  mapRegionCode,
  mapCityCode,
}: PhotoRecordUpload): Promise<PhotoRecord> {
  const body = new FormData()
  body.append('file', file)
  appendOptionalField(body, 'takenAt', takenAt)
  appendOptionalField(body, 'placeName', placeName)
  appendOptionalField(body, 'memo', memo)
  appendOptionalField(body, 'mapRegionCode', mapRegionCode)
  appendOptionalField(body, 'mapCityCode', mapCityCode)

  const { data } = await apiClient.post<PhotoRecord>('/me/photos', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function uploadPhotoRecordBundle({
  files,
  takenAt,
  endedAt,
  manualTakenAts,
  placeName,
  memo,
  mapRegionCode,
  mapCityCode,
}: PhotoRecordBundleUpload): Promise<PhotoRecordBundle> {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  appendOptionalField(body, 'takenAt', takenAt)
  appendOptionalField(body, 'endedAt', endedAt)
  if (manualTakenAts?.some((value) => value?.trim())) {
    // The API contract requires a value per file whenever this repeated field
    // is present. A non-empty sentinel keeps automatic slots positional.
    manualTakenAts.forEach((value) => body.append('manualTakenAts', value?.trim() || AUTOMATIC_TAKEN_AT))
  }
  appendOptionalField(body, 'placeName', placeName)
  appendOptionalField(body, 'memo', memo)
  appendOptionalField(body, 'mapRegionCode', mapRegionCode)
  appendOptionalField(body, 'mapCityCode', mapCityCode)

  const { data } = await apiClient.post<PhotoRecordBundle>(
    '/me/photos/bundles',
    body,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function updatePhotoRecord(
  id: number,
  update: PhotoRecordUpdate,
): Promise<PhotoRecord> {
  const { data } = await apiClient.patch<PhotoRecord>(
    `/me/photos/${id}`,
    update,
  )
  return data
}

export async function deletePhotoRecord(id: number): Promise<void> {
  await apiClient.delete(`/me/photos/${id}`)
}

export async function deletePhotoRecordBundle(id: number): Promise<void> {
  await apiClient.delete(`/me/photos/bundles/${id}`)
}

function appendOptionalField(
  body: FormData,
  name: string,
  value: string | null | undefined,
): void {
  if (value !== undefined && value !== null && value.trim() !== '')
    body.append(name, value)
}
