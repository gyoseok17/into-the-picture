import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createComparison,
  deleteComparison,
  deleteUserPhoto,
  fetchComparisons,
  fetchPublicContestComparisons,
  fetchUserPhotos,
  updateComparisonVisibility,
} from '../api'

export const useUserPhotos = () =>
  useQuery({ queryKey: ['user-photos'], queryFn: fetchUserPhotos })

export const useComparisons = (enabled = true) =>
  useQuery({ queryKey: ['comparisons'], queryFn: fetchComparisons, enabled })

const publicContestComparisonsKey = (contestId: number) => ['public-contest-comparisons', contestId] as const

export const usePublicContestComparisons = (contestId: number, enabled = true) =>
  useQuery({
    queryKey: publicContestComparisonsKey(contestId),
    queryFn: () => fetchPublicContestComparisons(contestId),
    enabled: enabled && contestId > 0,
  })

function invalidateAlbumQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['photo-records'] })
  void queryClient.invalidateQueries({ queryKey: ['photo-record-bundles'] })
  void queryClient.invalidateQueries({ queryKey: ['photo-record-map'] })
  void queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] })
}

export function useDeleteUserPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUserPhoto,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['user-photos'] }),
  })
}

export function useCreateComparison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userPhotoId, contestId, crop }: { userPhotoId: number; contestId: number; crop: import('../types').ComparisonCrop }) =>
      createComparison(userPhotoId, contestId, crop),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] })
      void queryClient.invalidateQueries({ queryKey: ['public-contest-comparisons'] })
    },
  })
}

export function useDeleteComparison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, deletePhoto }: { id: number; deletePhoto: boolean }) =>
      deleteComparison(id, deletePhoto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] })
      void queryClient.invalidateQueries({ queryKey: ['public-contest-comparisons'] })
      void queryClient.invalidateQueries({ queryKey: ['user-photos'] })
      invalidateAlbumQueries(queryClient)
    },
  })
}

export function useUpdateComparisonVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, visibility }: { id: number; visibility: import('../types').ComparisonVisibility }) =>
      updateComparisonVisibility(id, visibility),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] })
      void queryClient.invalidateQueries({ queryKey: ['public-contest-comparisons'] })
    },
  })
}
