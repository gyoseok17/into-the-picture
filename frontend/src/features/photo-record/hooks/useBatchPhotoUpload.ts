import { useEffect, useRef, useState } from "react";

import { useUploadPhotoRecordBundle } from "./usePhotoRecords";
import { extractImageTakenAt } from "../lib/extractJpegTakenAt";
import type { PhotoRecordBundleDraft, PhotoRecordDraft } from "../types";
import { mapLocationLabel } from "../lib/photoUploadPresentation";
import {
  MAX_PHOTO_UPLOAD_FILE_SIZE,
  MAX_PHOTO_UPLOAD_SELECTION,
  PHOTO_UPLOAD_FILE_SIZE_LABEL,
  type PhotoUploadItem,
} from "../types/photoUpload";

export function useBatchPhotoUpload({
  initialLocation,
  onComplete,
  onUploadStateChange,
}: {
  initialLocation?: Pick<PhotoRecordDraft, "mapRegionCode" | "mapCityCode">;
  onComplete: () => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}) {
  const uploadBundle = useUploadPhotoRecordBundle();
  const itemRef = useRef<PhotoUploadItem[]>([]);
  const [items, setItems] = useState<PhotoUploadItem[]>([]);
  const [common, setCommon] = useState<PhotoRecordBundleDraft>(() => ({
    mapRegionCode: initialLocation?.mapRegionCode ?? null,
    mapCityCode: initialLocation?.mapCityCode ?? null,
    placeName: mapLocationLabel(initialLocation),
  }));
  const [isUploading, setIsUploading] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  useEffect(() => {
    itemRef.current = items;
  }, [items]);
  useEffect(
    () => () =>
      itemRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    [],
  );
  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  const needsCommonTakenAt =
    !common.takenAt?.trim() &&
    items.some((item) => item.exif !== "found" && !item.manualTakenAt?.trim());
  const hasLocation = Boolean(common.mapRegionCode && common.mapCityCode);
  const hasInvalidVisitPeriod =
    Boolean(common.endedAt?.trim()) &&
    (!common.takenAt?.trim() || common.endedAt! < common.takenAt!);
  const pendingItems = items.filter(
    (item) => item.status === "ready" || item.status === "failed",
  );

  async function selectFiles(files: FileList | null): Promise<void> {
    if (!files || isUploading) return;
    const selected = Array.from(files);
    const oversized = selected.filter(
      (file) => file.size > MAX_PHOTO_UPLOAD_FILE_SIZE,
    );
    const valid = selected.filter(
      (file) => file.size <= MAX_PHOTO_UPLOAD_FILE_SIZE,
    );
    const limited = valid.slice(0, MAX_PHOTO_UPLOAD_SELECTION);
    const notices: string[] = [];
    if (oversized.length)
      notices.push(
        `${oversized.length}장은 ${PHOTO_UPLOAD_FILE_SIZE_LABEL}를 초과해 제외했어요.`,
      );
    if (valid.length > MAX_PHOTO_UPLOAD_SELECTION)
      notices.push(
        `한 번에 최대 ${MAX_PHOTO_UPLOAD_SELECTION}장까지 추가할 수 있어 처음 ${MAX_PHOTO_UPLOAD_SELECTION}장만 골랐어요.`,
      );
    setSelectionNotice(notices.length ? notices.join(" ") : null);
    if (!limited.length) return;
    const prepared = await Promise.all(limited.map(prepareItem));
    setItems((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return prepared;
    });
  }

  async function uploadPending(): Promise<void> {
    const targets = pendingItems;
    if (
      !targets.length ||
      isUploading ||
      needsCommonTakenAt ||
      hasInvalidVisitPeriod ||
      !hasLocation
    )
      return;
    setIsUploading(true);
    setItems((previous) => changeItemStatus(previous, targets, "uploading"));
    try {
      await uploadBundle.mutateAsync({
        files: targets.map((item) => item.file),
        takenAt: toManualTakenAt(common.takenAt),
        endedAt: toManualTakenAt(common.endedAt),
        manualTakenAts: manualTakenAtsForUpload(targets),
        placeName: common.placeName?.trim() || null,
        memo: common.memo?.trim() || null,
        mapRegionCode: common.mapRegionCode,
        mapCityCode: common.mapCityCode,
      });
      setItems((previous) => changeItemStatus(previous, targets, "success"));
      onComplete();
    } catch {
      setItems((previous) => changeItemStatus(previous, targets, "failed"));
    } finally {
      setIsUploading(false);
    }
  }

  return {
    items,
    setItems,
    common,
    setCommon,
    isUploading,
    selectionNotice,
    needsCommonTakenAt,
    hasLocation,
    hasInvalidVisitPeriod,
    pendingCount: hasLocation ? pendingItems.length : 0,
    successCount: items.filter((item) => item.status === "success").length,
    failedCount: items.filter((item) => item.status === "failed").length,
    selectFiles,
    uploadPending,
  };
}

async function prepareItem(file: File): Promise<PhotoUploadItem> {
  try {
    const exif = await extractImageTakenAt(file);
    return {
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      previewUrl: URL.createObjectURL(file),
      takenAt: exif.status === "found" ? exif.takenAt : null,
      manualTakenAt: null,
      exif: exif.status,
      status: "ready",
    };
  } catch {
    return {
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      previewUrl: URL.createObjectURL(file),
      takenAt: null,
      manualTakenAt: null,
      exif: "invalid",
      status: "ready",
    };
  }
}
function changeItemStatus(
  items: PhotoUploadItem[],
  targets: PhotoUploadItem[],
  status: PhotoUploadItem["status"],
) {
  return items.map((item) =>
    targets.some((target) => target.id === item.id)
      ? { ...item, status }
      : item,
  );
}
function toManualTakenAt(value: string | null | undefined): string | null {
  return value?.trim() ? `${value}T00:00:00` : null;
}
function manualTakenAtsForUpload(
  items: PhotoUploadItem[],
): Array<string | null> | undefined {
  const values = items.map((item) => toManualTakenAt(item.manualTakenAt));
  return values.some((value) => value !== null) ? values : undefined;
}
