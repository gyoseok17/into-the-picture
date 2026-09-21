export const crowdQueryKeys = {
  all: ["crowd"] as const,
  regions: ["crowd", "regions"] as const,
  sigungu: (areaCd: string) => ["crowd", "sigungu", areaCd] as const,
  attractions: (areaCd: string, sigunguCd: string) =>
    ["crowd", "attractions", areaCd, sigunguCd] as const,
  forecast: (areaCd: string, sigunguCd: string, attraction: string) =>
    ["crowd", "forecast", areaCd, sigunguCd, attraction] as const,
  contests: (attraction: string) =>
    ["crowd", "contests", attraction] as const,
};
