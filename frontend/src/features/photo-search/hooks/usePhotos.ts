import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPhotos } from '../api'

export function usePhotos(keyword: string) {
  return useInfiniteQuery({ queryKey: ['photos', keyword], queryFn: ({ pageParam }) => fetchPhotos(keyword, pageParam), initialPageParam: 1, getNextPageParam: (last) => last.page.hasNext ? last.page.page + 1 : undefined })
}
