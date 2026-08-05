import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addContestFavorite, fetchContestFavoriteStatus, fetchFavoriteContests, removeContestFavorite } from '../api'
import type { ContestSummary } from '@/features/contest/types'
import type { FavoriteContest, FavoriteStatus } from '../types'

const favoriteContestsKey = ['favorites', 'contests'] as const
const favoriteStatusKey = (contestId: number) => ['favorites', 'contests', contestId] as const

export function useFavoriteContests(enabled = true) {
  return useQuery({ queryKey: favoriteContestsKey, queryFn: fetchFavoriteContests, enabled })
}

export function useContestFavoriteStatus(contestId: number, enabled: boolean) {
  return useQuery({ queryKey: favoriteStatusKey(contestId), queryFn: () => fetchContestFavoriteStatus(contestId), enabled })
}

export function useToggleContestFavorite(contestId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ favorite }: { favorite: boolean; contest: ContestSummary }) => favorite ? removeContestFavorite(contestId) : addContestFavorite(contestId),
    onMutate: async ({ favorite, contest }) => {
      await queryClient.cancelQueries({ queryKey: favoriteStatusKey(contestId) })
      await queryClient.cancelQueries({ queryKey: favoriteContestsKey })
      const previousStatus = queryClient.getQueryData<FavoriteStatus>(favoriteStatusKey(contestId))
      const previousContests = queryClient.getQueryData<FavoriteContest[]>(favoriteContestsKey)
      queryClient.setQueryData<FavoriteStatus>(favoriteStatusKey(contestId), { favorite: !favorite })
      queryClient.setQueryData<FavoriteContest[]>(favoriteContestsKey, (current = []) => favorite
        ? current.filter((item) => item.contestId !== contestId)
        : [{ favoriteId: -contestId, contestId, contest, createdAt: new Date().toISOString() }, ...current])
      return { previousStatus, previousContests }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(favoriteStatusKey(contestId), context?.previousStatus)
      queryClient.setQueryData(favoriteContestsKey, context?.previousContests)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteStatusKey(contestId) })
      void queryClient.invalidateQueries({ queryKey: favoriteContestsKey })
    },
  })
}
