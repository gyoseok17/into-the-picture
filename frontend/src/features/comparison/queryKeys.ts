import type { QueryClient } from "@tanstack/react-query";

export const comparisonQueryKeys = {
  all: ["comparisons"] as const,
  publicByContest: ["public-contest-comparisons"] as const,
  publicContest: (contestId: number) =>
    ["public-contest-comparisons", contestId] as const,
};

export async function invalidateComparisonQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: comparisonQueryKeys.all }),
    queryClient.invalidateQueries({
      queryKey: comparisonQueryKeys.publicByContest,
    }),
  ]);
}
