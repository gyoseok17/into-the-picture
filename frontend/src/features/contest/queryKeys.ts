import type { ContestQuery } from "./types";

export const contestQueryKeys = {
  all: ["contests"] as const,
  list: (query: ContestQuery) => ["contests", query] as const,
  detail: (contestId: number) => ["contest", contestId] as const,
  filters: ["contest-filters"] as const,
  map: (query: ContestQuery) => ["contest-map", query] as const,
  crowd: (contestId: number) => ["contest-crowd", contestId] as const,
};
