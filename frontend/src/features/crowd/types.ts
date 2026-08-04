export interface CrowdRegion {
  areaCd: string
  areaNm: string
}

export interface CrowdSigungu extends CrowdRegion {
  sigunguCd: string
  sigunguNm: string
}

export interface CrowdDaily {
  date: string
  rate: number
}

export interface CrowdForecast {
  attractionName: string
  areaNm: string
  sigunguNm: string
  matchType: 'EXACT' | 'PARTIAL'
  daily: CrowdDaily[]
  recommendedDates: string[]
}
