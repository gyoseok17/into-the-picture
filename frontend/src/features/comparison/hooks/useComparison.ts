import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createComparison,
  deleteComparison,
  fetchComparisons,
  fetchPublicContestComparisons,
  replaceComparisonPhoto,
  updateComparisonCrop,
  updateComparisonVisibility,
} from "../api";
import { invalidatePhotoRecordQueries } from "@/features/photo-record/queryKeys";
import { comparisonQueryKeys, invalidateComparisonQueries } from "../queryKeys";

export const useComparisons = (enabled = true) =>
  useQuery({
    queryKey: comparisonQueryKeys.all,
    queryFn: fetchComparisons,
    enabled,
  });

export const usePublicContestComparisons = (
  contestId: number,
  enabled = true,
) =>
  useQuery({
    queryKey: comparisonQueryKeys.publicContest(contestId),
    queryFn: () => fetchPublicContestComparisons(contestId),
    enabled: enabled && contestId > 0,
  });

export function useCreateComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userPhotoId,
      contestId,
      crop,
    }: {
      userPhotoId: number;
      contestId: number;
      crop: import("../types").ComparisonCrop;
    }) => createComparison(userPhotoId, contestId, crop),
    onSuccess: () => {
      void Promise.all([
        invalidateComparisonQueries(queryClient),
        invalidatePhotoRecordQueries(queryClient),
      ]);
    },
  });
}

export function useDeleteComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, deletePhoto }: { id: number; deletePhoto: boolean }) =>
      deleteComparison(id, deletePhoto),
    onSuccess: () => {
      void Promise.all([
        invalidateComparisonQueries(queryClient),
        invalidatePhotoRecordQueries(queryClient),
      ]);
    },
  });
}

export function useReplaceComparisonPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userPhotoId,
      crop,
    }: {
      id: number;
      userPhotoId: number;
      crop: import("../types").ComparisonCrop;
    }) => replaceComparisonPhoto(id, userPhotoId, crop),
    onSuccess: () => {
      void Promise.all([
        invalidateComparisonQueries(queryClient),
        invalidatePhotoRecordQueries(queryClient),
      ]);
    },
  });
}

export function useUpdateComparisonCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      crop,
    }: {
      id: number;
      crop: import("../types").ComparisonCrop;
    }) => updateComparisonCrop(id, crop),
    onSuccess: () => {
      void invalidateComparisonQueries(queryClient);
    },
  });
}

export function useUpdateComparisonVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      visibility,
    }: {
      id: number;
      visibility: import("../types").ComparisonVisibility;
    }) => updateComparisonVisibility(id, visibility),
    onSuccess: () => {
      void invalidateComparisonQueries(queryClient);
    },
  });
}
