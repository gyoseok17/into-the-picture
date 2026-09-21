import { useState } from "react";
import { createPortal } from "react-dom";
import { Trophy } from "lucide-react";

import { AspectImage } from "@/components/AspectImage";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";
import { PhotoComparisonLightboxInfo } from "@/features/comparison/components/PhotoComparisonLinks";
import type { PhotoComparison } from "@/features/comparison/types";
import type { PhotoRecordBundleMapPin } from "../types";

interface MapPhotoLightboxProps {
  photos: PhotoRecordBundleMapPin["photos"];
  placeName: string;
  comparisons: PhotoComparison[];
  initialIndex: number;
  onPhotoChange: (index: number) => void;
  onClose: () => void;
}

export function MapPhotoLightbox({
  photos,
  placeName,
  comparisons,
  initialIndex,
  onPhotoChange,
  onClose,
}: MapPhotoLightboxProps) {
  const [photoIndex, setPhotoIndex] = useState(initialIndex);
  const photo = photos[photoIndex];
  const photoComparisons = comparisons.filter(
    (comparison) => comparison.userPhoto.id === photo?.id,
  );

  useDocumentScrollLock();

  useEscapeDismiss(onClose);

  if (!photo) return null;

  const selectPhoto = (index: number) => {
    setPhotoIndex(index);
    onPhotoChange(index);
  };
  const movePhoto = (amount: number) => {
    const nextIndex = (photoIndex + amount + photos.length) % photos.length;
    selectPhoto(nextIndex);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-label="사진 크게 보기"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <section
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{placeName || "장소 정보 없음"}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            닫기
          </button>
        </div>
        <div className="overflow-hidden rounded-xl">
          <AspectImage
            src={photo.url}
            alt={photo.originalFilename ?? "여행 사진"}
            ratioClassName="aspect-[4/3]"
            className="w-full"
          />
        </div>
        {photoComparisons.length ? (
          <PhotoComparisonLightboxInfo comparisons={photoComparisons} />
        ) : null}
        {photos.length > 1 ? (
          <>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => movePhoto(-1)}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                이전
              </button>
              <span className="text-xs text-muted-foreground">
                {photoIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => movePhoto(1)}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                다음
              </button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {photos.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectPhoto(itemIndex)}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 ${itemIndex === photoIndex ? "border-primary" : "border-transparent opacity-70"}`}
                  aria-label={`${itemIndex + 1}번째 사진 보기`}
                >
                  <AspectImage
                    src={item.url}
                    alt=""
                    ratioClassName="aspect-square"
                    className="h-full w-full"
                  />
                  {comparisons.some(
                    (comparison) => comparison.userPhoto.id === item.id,
                  ) ? (
                    <span className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-primary text-primary-foreground shadow-sm">
                      <Trophy className="h-2 w-2" aria-hidden />
                      <span className="sr-only">비교 연결된 사진</span>
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
