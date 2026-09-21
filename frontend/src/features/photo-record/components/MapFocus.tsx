import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy, X } from "lucide-react";

import { AspectImage } from "@/components/AspectImage";
import {
  PhotoComparisonTrophyBadge,
} from "@/features/comparison/components/PhotoComparisonLinks";
import type { PhotoComparison } from "@/features/comparison/types";
import { useSetPhotoRecordMapRepresentative } from "../hooks/usePhotoRecords";
import { formatPhotoVisitPeriod } from "../lib/formatPhotoVisitPeriod";
import { formatTakenAt } from "../lib/photoRecordAlbumPresentation";
import type { PhotoRecordMapPinGroup } from "../types/photoRecordMap";
import { MapPhotoLightbox } from "./MapPhotoLightbox";
import { MapVisitHistory } from "./MapVisitHistory";

interface MapFocusProps {
  group: PhotoRecordMapPinGroup;
  comparisons: PhotoComparison[];
  recordIndex: number;
  onRecordIndexChange: (index: number) => void;
  onClose: () => void;
}

export function MapFocus({
  group,
  comparisons,
  recordIndex,
  onRecordIndexChange,
  onClose,
}: MapFocusProps) {
  const record = group.pins[recordIndex];
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(
    null,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRepresentative, setIsRepresentative] = useState(
    record?.representative ?? false,
  );
  const photoTriggerRef = useRef<HTMLButtonElement>(null);
  const setRepresentative = useSetPhotoRecordMapRepresentative();

  useEffect(() => {
    setPhotoIndex(0);
    setLightboxPhotoIndex(null);
    setIsHistoryOpen(false);
    setIsRepresentative(record?.representative ?? false);
  }, [record?.id, recordIndex]);

  if (!record || record.photos.length === 0) return null;

  const safePhotoIndex = Math.min(photoIndex, record.photos.length - 1);
  const photo = record.photos[safePhotoIndex];
  const photoComparisons = comparisons.filter(
    (comparison) => comparison.userPhoto.id === photo?.id,
  );
  const otherRecords = group.pins
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== recordIndex);
  const hasMultiplePhotos = record.photos.length > 1;

  const movePhoto = (amount: number) =>
    setPhotoIndex(
      (current) =>
        (current + amount + record.photos.length) % record.photos.length,
    );
  const chooseRepresentative = () => {
    const photoRecordId = record.photos[0]?.id;
    if (!photoRecordId || isRepresentative || setRepresentative.isPending)
      return;
    setRepresentative.mutate(photoRecordId, {
      onSuccess: () => setIsRepresentative(true),
    });
  };

  return (
    <aside
      className="absolute inset-x-3 bottom-3 z-20 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-80 lg:w-96"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{record.placeName}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatPhotoVisitPeriod(record.takenAt, record.endedAt) ??
              formatTakenAt(record.takenAt) ??
              "촬영일 미상"}
            {hasMultiplePhotos
              ? ` · 사진 ${safePhotoIndex + 1}/${record.photos.length}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isRepresentative ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              대표
            </span>
          ) : (
            <button
              type="button"
              onClick={chooseRepresentative}
              disabled={setRepresentative.isPending}
              className="rounded-full border border-primary/25 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60"
            >
              {setRepresentative.isPending ? "설정 중" : "대표로 설정"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="기록 닫기"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {setRepresentative.isError ? (
        <p role="alert" className="mb-2 text-right text-xs text-destructive">
          대표 기록으로 설정하지 못했어요. 다시 시도해 주세요.
        </p>
      ) : null}

      <div className="relative mt-3 overflow-hidden rounded-xl bg-muted">
        <button
          ref={photoTriggerRef}
          type="button"
          onClick={() => setLightboxPhotoIndex(safePhotoIndex)}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          aria-label="사진 크게 보기"
        >
          <AspectImage
            src={photo.url}
            alt={photo.originalFilename ?? "여행 사진"}
            ratioClassName="aspect-[4/3]"
            className="w-full"
          />
        </button>
        <PhotoComparisonTrophyBadge comparisons={photoComparisons} />
        {hasMultiplePhotos ? (
          <>
            <button
              type="button"
              onClick={() => movePhoto(-1)}
              aria-label="이전 사진"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => movePhoto(1)}
              aria-label="다음 사진"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiplePhotos ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {record.photos.map((item, itemIndex) => {
            const hasComparison = comparisons.some(
              (comparison) => comparison.userPhoto.id === item.id,
            );
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPhotoIndex(itemIndex)}
                className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-md border-2 ${itemIndex === photoIndex ? "border-primary" : "border-transparent opacity-65"}`}
                aria-label={`${itemIndex + 1}번째 사진 선택${hasComparison ? ", 수상작 비교 연결됨" : ""}`}
              >
                <AspectImage
                  src={item.url}
                  alt=""
                  ratioClassName="aspect-square"
                  className="h-full w-full"
                />
                {hasComparison ? (
                  <span className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-primary text-primary-foreground shadow-sm">
                    <Trophy className="h-2 w-2" aria-hidden />
                    <span className="sr-only">수상작 비교 연결됨</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {otherRecords.length ? (
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="mt-3 w-full border-t pt-3 text-left text-sm font-medium text-primary hover:underline"
        >
          이전 방문 기록 {otherRecords.length}건
        </button>
      ) : null}
      {isHistoryOpen ? (
        <MapVisitHistory
          records={otherRecords}
          onChoose={(index) => {
            onRecordIndexChange(index);
            setIsHistoryOpen(false);
          }}
          onClose={() => setIsHistoryOpen(false)}
        />
      ) : null}
      {lightboxPhotoIndex != null ? (
        <MapPhotoLightbox
          photos={record.photos}
          placeName={record.placeName}
          comparisons={comparisons}
          initialIndex={lightboxPhotoIndex}
          onPhotoChange={setPhotoIndex}
          onClose={() => {
            setLightboxPhotoIndex(null);
            window.requestAnimationFrame(() => photoTriggerRef.current?.focus());
          }}
        />
      ) : null}
    </aside>
  );
}
