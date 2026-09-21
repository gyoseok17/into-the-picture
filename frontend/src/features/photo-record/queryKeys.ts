import type { QueryClient } from "@tanstack/react-query";

export const photoRecordQueryKeys = {
  records: ["photo-records"] as const,
  bundles: ["photo-record-bundles"] as const,
  map: ["photo-record-map"] as const,
  bundleMap: ["photo-record-bundle-map"] as const,
  mapLocations: ["photo-record-map-locations"] as const,
};

/** Invalidates every album projection after a photo-record mutation. */
export async function invalidatePhotoRecordQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: photoRecordQueryKeys.records }),
    queryClient.invalidateQueries({ queryKey: photoRecordQueryKeys.bundles }),
    queryClient.invalidateQueries({ queryKey: photoRecordQueryKeys.map }),
    queryClient.invalidateQueries({ queryKey: photoRecordQueryKeys.bundleMap }),
  ]);
}
