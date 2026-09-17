import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deletePhotoRecord,
  deletePhotoRecordBundle,
  fetchMapLocationOptions,
  fetchPhotoRecordMap,
  fetchPhotoRecordBundleMap,
  fetchPhotoRecordBundles,
  fetchPhotoRecords,
  setPhotoRecordMapRepresentative,
  updatePhotoRecord,
  uploadPhotoRecord,
  uploadPhotoRecordBundle,
} from '../api'
import type { PhotoRecordBundleUpload, PhotoRecordUpdate, PhotoRecordUpload } from '../types'

const photoRecordKey = (archived: boolean) =>
  ['photo-records', { archived }] as const

export function usePhotoRecords(archived: boolean) {
  return useQuery({
    queryKey: photoRecordKey(archived),
    queryFn: () => fetchPhotoRecords(archived),
  })
}

export function usePhotoRecordBundles(archived: boolean, enabled = true) {
  return useQuery({
    queryKey: ['photo-record-bundles', { archived }] as const,
    queryFn: () => fetchPhotoRecordBundles(archived),
    enabled,
  })
}

export function usePhotoRecordMap(enabled: boolean) {
  return useQuery({
    queryKey: ['photo-record-map'],
    queryFn: fetchPhotoRecordMap,
    enabled,
  })
}

export function usePhotoRecordBundleMap(enabled: boolean) {
  return useQuery({
    queryKey: ['photo-record-bundle-map'],
    queryFn: fetchPhotoRecordBundleMap,
    enabled,
  })
}

export function useSetPhotoRecordMapRepresentative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setPhotoRecordMapRepresentative,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] })
    },
  })
}

export function useMapLocationOptions(enabled = true) {
  return useQuery({
    queryKey: ['photo-record-map-locations'],
    queryFn: fetchMapLocationOptions,
    enabled,
    staleTime: Infinity,
  })
}

export function useUploadPhotoRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PhotoRecordUpload) => uploadPhotoRecord(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photo-records'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundles'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-map'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] })
      void queryClient.invalidateQueries({ queryKey: ['user-photos'] })
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] })
    },
  })
}

export function useUploadPhotoRecordBundle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PhotoRecordBundleUpload) => uploadPhotoRecordBundle(input),
    onSuccess: () => invalidatePhotoRecordQueries(queryClient),
  })
}

export function useUpdatePhotoRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: PhotoRecordUpdate }) =>
      updatePhotoRecord(id, update),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photo-records'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundles'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-map'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] })
      void queryClient.invalidateQueries({ queryKey: ['user-photos'] })
    },
  })
}

function invalidatePhotoRecordQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['photo-records'] })
  void queryClient.invalidateQueries({ queryKey: ['photo-record-bundles'] })
  void queryClient.invalidateQueries({ queryKey: ['photo-record-map'] })
  void queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] })
  void queryClient.invalidateQueries({ queryKey: ['user-photos'] })
  void queryClient.invalidateQueries({ queryKey: ['comparisons'] })
}

export function useDeletePhotoRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePhotoRecord(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photo-records'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundles'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-map'] })
      void queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] })
      void queryClient.invalidateQueries({ queryKey: ['user-photos'] })
    },
  })
}

export function useDeletePhotoRecordBundle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePhotoRecordBundle(id),
    onSuccess: () => invalidatePhotoRecordQueries(queryClient),
  })
}
