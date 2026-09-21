import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addContestFavorite, fetchContestFavoriteStatus, fetchFavoriteContests, removeContestFavorite } from '../api'
import type { ContestSummary } from '@/features/contest/types'
import type { FavoriteContest, FavoriteStatus } from '../types'
import { favoriteQueryKeys } from '../queryKeys'

export function useFavoriteContests(enabled = true) {
  return useQuery({ queryKey: favoriteQueryKeys.contests, queryFn: fetchFavoriteContests, enabled })
}

export function useContestFavoriteStatus(contestId: number, enabled: boolean) {
  return useQuery({ queryKey: favoriteQueryKeys.contestStatus(contestId), queryFn: () => fetchContestFavoriteStatus(contestId), enabled })
}

export function useToggleContestFavorite(contestId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ favorite }: { favorite: boolean; contest: ContestSummary }) => favorite ? removeContestFavorite(contestId) : addContestFavorite(contestId),
    onMutate: async ({ favorite, contest }) => {
      await queryClient.cancelQueries({ queryKey: favoriteQueryKeys.contestStatus(contestId) })
      await queryClient.cancelQueries({ queryKey: favoriteQueryKeys.contests })
      const previousStatus = queryClient.getQueryData<FavoriteStatus>(favoriteQueryKeys.contestStatus(contestId))
      const previousContests = queryClient.getQueryData<FavoriteContest[]>(favoriteQueryKeys.contests)
      queryClient.setQueryData<FavoriteStatus>(favoriteQueryKeys.contestStatus(contestId), { favorite: !favorite })
      queryClient.setQueryData<FavoriteContest[]>(favoriteQueryKeys.contests, (current = []) => favorite
        ? current.filter((item) => item.contestId !== contestId)
        : [{ favoriteId: -contestId, contestId, contest, createdAt: new Date().toISOString() }, ...current])
      return { previousStatus, previousContests }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(favoriteQueryKeys.contestStatus(contestId), context?.previousStatus)
      queryClient.setQueryData(favoriteQueryKeys.contests, context?.previousContests)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteQueryKeys.contestStatus(contestId) })
      void queryClient.invalidateQueries({ queryKey: favoriteQueryKeys.contests })
    },
  })
}
