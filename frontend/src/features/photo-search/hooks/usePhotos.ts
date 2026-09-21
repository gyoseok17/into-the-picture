import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPhotos } from '../api'
import { photoSearchQueryKeys } from '../queryKeys'

export function usePhotos(keyword: string, enabled = true) {
  return useInfiniteQuery({ queryKey: photoSearchQueryKeys.keyword(keyword), queryFn: ({ pageParam }) => fetchPhotos(keyword, pageParam), initialPageParam: 1, getNextPageParam: (last) => last.page.hasNext ? last.page.page + 1 : undefined, enabled })
}
