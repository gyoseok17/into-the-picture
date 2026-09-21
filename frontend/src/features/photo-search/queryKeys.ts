export const photoSearchQueryKeys = {
  all: ["photos"] as const,
  keyword: (keyword: string) => ["photos", keyword] as const,
};
