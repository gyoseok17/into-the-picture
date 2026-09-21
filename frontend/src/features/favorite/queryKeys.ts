export const favoriteQueryKeys = {
  all: ["favorites"] as const,
  contests: ["favorites", "contests"] as const,
  contestStatus: (contestId: number) =>
    ["favorites", "contests", contestId] as const,
};
