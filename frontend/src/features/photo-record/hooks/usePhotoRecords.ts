import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "../api";
import type {
  PhotoRecordBundleUpload,
  PhotoRecordUpdate,
  PhotoRecordUpload,
} from "../types";
import {
  invalidatePhotoRecordQueries,
  photoRecordQueryKeys,
} from "../queryKeys";
import { invalidateComparisonQueries } from "@/features/comparison/queryKeys";

export function usePhotoRecords() {
  return useQuery({
    queryKey: photoRecordQueryKeys.records,
    queryFn: fetchPhotoRecords,
  });
}

export function usePhotoRecordBundles(enabled = true) {
  return useQuery({
    queryKey: photoRecordQueryKeys.bundles,
    queryFn: fetchPhotoRecordBundles,
    enabled,
  });
}

export function usePhotoRecordMap(enabled: boolean) {
  return useQuery({
    queryKey: photoRecordQueryKeys.map,
    queryFn: fetchPhotoRecordMap,
    enabled,
  });
}

export function usePhotoRecordBundleMap(enabled: boolean) {
  return useQuery({
    queryKey: photoRecordQueryKeys.bundleMap,
    queryFn: fetchPhotoRecordBundleMap,
    enabled,
  });
}

export function useSetPhotoRecordMapRepresentative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setPhotoRecordMapRepresentative,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: photoRecordQueryKeys.bundleMap,
      });
    },
  });
}

export function useMapLocationOptions(enabled = true) {
  return useQuery({
    queryKey: photoRecordQueryKeys.mapLocations,
    queryFn: fetchMapLocationOptions,
    enabled,
    staleTime: Infinity,
  });
}

export function useUploadPhotoRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PhotoRecordUpload) => uploadPhotoRecord(input),
    onSuccess: () =>
      void Promise.all([
        invalidatePhotoRecordQueries(queryClient),
        invalidateComparisonQueries(queryClient),
      ]),
  });
}

export function useUploadPhotoRecordBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PhotoRecordBundleUpload) =>
      uploadPhotoRecordBundle(input),
    // `mutateAsync` must settle only after the album can render the new bundle;
    // BatchPhotoUploadPanel closes itself immediately after this mutation succeeds.
    onSuccess: async () => {
      await Promise.all([
        invalidatePhotoRecordQueries(queryClient),
        invalidateComparisonQueries(queryClient),
      ]);
    },
  });
}

export function useUpdatePhotoRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: PhotoRecordUpdate }) =>
      updatePhotoRecord(id, update),
    onSuccess: () => void invalidatePhotoRecordQueries(queryClient),
  });
}

export function useDeletePhotoRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePhotoRecord(id),
    onSuccess: () => void invalidatePhotoRecordQueries(queryClient),
  });
}

export function useDeletePhotoRecordBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePhotoRecordBundle(id),
    onSuccess: () =>
      void Promise.all([
        invalidatePhotoRecordQueries(queryClient),
        invalidateComparisonQueries(queryClient),
      ]),
  });
}
