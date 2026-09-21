import { apiClient } from "@/lib/apiClient";
import type {
  ComparisonCrop,
  ComparisonVisibility,
  PhotoComparison,
  PublicContestComparison,
} from "./types";
export async function fetchComparisons(): Promise<PhotoComparison[]> {
  const { data } = await apiClient.get<PhotoComparison[]>("/me/comparisons");
  return data;
}
export async function fetchPublicContestComparisons(
  contestId: number,
): Promise<PublicContestComparison[]> {
  const { data } = await apiClient.get<PublicContestComparison[]>(
    `/contests/${contestId}/comparisons`,
  );
  return data;
}
export async function createComparison(
  userPhotoId: number,
  contestId: number,
  crop: ComparisonCrop,
): Promise<PhotoComparison> {
  const { data } = await apiClient.post<PhotoComparison>("/me/comparisons", {
    userPhotoId,
    contestId,
    crop,
  });
  return data;
}
export async function replaceComparisonPhoto(
  id: number,
  userPhotoId: number,
  crop: ComparisonCrop,
): Promise<PhotoComparison> {
  const { data } = await apiClient.patch<PhotoComparison>(
    `/me/comparisons/${id}`,
    { userPhotoId, crop },
  );
  return data;
}
export async function updateComparisonCrop(
  id: number,
  crop: ComparisonCrop,
): Promise<PhotoComparison> {
  const { data } = await apiClient.patch<PhotoComparison>(
    `/me/comparisons/${id}/crop`,
    { crop },
  );
  return data;
}
export async function deleteComparison(
  id: number,
  deletePhoto: boolean,
): Promise<void> {
  await apiClient.delete(`/me/comparisons/${id}`, { params: { deletePhoto } });
}
export async function updateComparisonVisibility(
  id: number,
  visibility: ComparisonVisibility,
): Promise<PhotoComparison> {
  const { data } = await apiClient.patch<PhotoComparison>(
    `/me/comparisons/${id}/visibility`,
    { visibility },
  );
  return data;
}

/** Resolves private photo URLs through the authenticated HTTP client. */
export async function fetchComparisonImage(src: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(src, { responseType: "blob" });
  return data;
}
