import { useQuery } from '@tanstack/react-query'
import { fetchAttractions, fetchCrowdForecast, fetchRegions, fetchRelatedContests, fetchSigungu } from '../api'

export const useCrowdRegions = () => useQuery({ queryKey: ['crowd', 'regions'], queryFn: fetchRegions })

export const useCrowdSigungu = (areaCd: string) => useQuery({
  queryKey: ['crowd', 'sigungu', areaCd],
  queryFn: () => fetchSigungu(areaCd),
  enabled: Boolean(areaCd),
})

export const useCrowdAttractions = (areaCd: string, sigunguCd: string) => useQuery({
  queryKey: ['crowd', 'attractions', areaCd, sigunguCd],
  queryFn: () => fetchAttractions(areaCd, sigunguCd),
  enabled: Boolean(areaCd && sigunguCd),
})

export const useCrowdForecast = (areaCd: string, sigunguCd: string, attraction: string) => useQuery({
  queryKey: ['crowd', 'forecast', areaCd, sigunguCd, attraction],
  queryFn: () => fetchCrowdForecast(areaCd, sigunguCd, attraction),
  enabled: Boolean(areaCd && sigunguCd && attraction),
})

export const useRelatedContests = (attraction: string) => useQuery({
  queryKey: ['crowd', 'contests', attraction],
  queryFn: () => fetchRelatedContests(attraction),
  enabled: Boolean(attraction),
})
