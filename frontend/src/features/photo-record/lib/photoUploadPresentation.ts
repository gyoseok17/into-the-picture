import { getKoreaCity, getKoreaRegion } from "./koreaRegions";
import type { PhotoRecordDraft } from "../types";
import type { PhotoUploadItem } from "../types/photoUpload";

export function mapLocationLabel(
  value: Pick<PhotoRecordDraft, "mapRegionCode" | "mapCityCode"> | undefined,
): string | null {
  const region = getKoreaRegion(value?.mapRegionCode);
  const city = getKoreaCity(value?.mapRegionCode, value?.mapCityCode);
  return region && city ? `${region.label} · ${city.label}` : null;
}
export function photoTakenAtLabel(
  item: PhotoUploadItem,
  fallbackTakenAt?: string | null,
): string {
  const takenAt = item.manualTakenAt || item.takenAt || fallbackTakenAt;
  if (takenAt)
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short" }).format(
      new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(takenAt) ? `${takenAt}T00:00:00` : takenAt,
      ),
    );
  return item.exif === "not-supported" ? "날짜 직접 입력" : "촬영일 없음";
}
export function photoDateSourceLabel(
  item: PhotoUploadItem,
  fallbackTakenAt?: string | null,
): string {
  if (item.manualTakenAt) return `직접 지정 · ${photoTakenAtLabel(item)}`;
  if (item.takenAt) return `사진 정보 · ${photoTakenAtLabel(item)}`;
  if (fallbackTakenAt)
    return `여행 시작일 사용 · ${photoTakenAtLabel(item, fallbackTakenAt)}`;
  return "촬영일을 직접 지정하거나 여행 시작일을 입력해 주세요.";
}
