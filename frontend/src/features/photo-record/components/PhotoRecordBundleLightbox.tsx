import { useRef, useState } from "react";
import { Trophy } from "lucide-react";

import { AspectImage, ImageSource } from "@/components/AspectImage";
import { Button } from "@/components/ui/button";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";
import { PhotoComparisonLightboxInfo } from "@/features/comparison/components/PhotoComparisonLinks";
import type { PhotoComparison } from "@/features/comparison/types";
import type { PhotoRecordBundle } from "../types";

const unknownPlace = "장소 미상";

export function PhotoRecordBundleLightbox({
  bundle,
  comparisonsByPhotoId,
  onClose,
}: {
  bundle: PhotoRecordBundle;
  comparisonsByPhotoId: Map<number, PhotoComparison[]>;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const imagePointerStart = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const photo = bundle.photos[index];
  const photoComparisons = photo
    ? (comparisonsByPhotoId.get(photo.id) ?? [])
    : [];
  const hasMultiplePhotos = bundle.photos.length > 1;
  useDocumentScrollLock();

  useEscapeDismiss(onClose);
  if (!photo) return null;

  const movePhoto = (amount: number) =>
    setIndex(
      (current) =>
        (current + amount + bundle.photos.length) % bundle.photos.length,
    );
  const handleImagePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!hasMultiplePhotos || event.button !== 0) return;
    imagePointerStart.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  };
  const handleImagePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const start = imagePointerStart.current;
    imagePointerStart.current = null;
    if (
      !start ||
      start.pointerId !== event.pointerId ||
      Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) >
        12
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    movePhoto(event.clientX - bounds.left < bounds.width / 2 ? -1 : 1);
  };

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="사진 묶음 보기"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <section
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {bundle.placeName || unknownPlace}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
        <button
          type="button"
          className="block w-full overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          onPointerDown={handleImagePointerDown}
          onPointerUp={handleImagePointerUp}
          onPointerCancel={() => {
            imagePointerStart.current = null;
          }}
          onDragStart={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (!hasMultiplePhotos) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              movePhoto(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              movePhoto(1);
            }
          }}
          aria-label={
            hasMultiplePhotos
              ? "사진 크게 보기. 왼쪽을 누르면 이전 사진, 오른쪽을 누르면 다음 사진"
              : "사진 크게 보기"
          }
        >
          <div className="flex max-h-[calc(100dvh-12rem)] min-h-48 w-full items-center justify-center bg-muted">
            <ImageSource
              src={photo.url}
              alt={photo.originalFilename ?? "여행 사진"}
              className="block max-h-[calc(100dvh-12rem)] w-auto max-w-full object-contain"
            />
          </div>
        </button>
        {photoComparisons.length ? (
          <PhotoComparisonLightboxInfo comparisons={photoComparisons} />
        ) : null}
        {hasMultiplePhotos ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {bundle.photos.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 ${itemIndex === index ? "border-primary" : "border-transparent opacity-70"}`}
              >
                <AspectImage
                  src={item.url}
                  alt=""
                  ratioClassName="aspect-square"
                  className="h-full w-full"
                />
                {(comparisonsByPhotoId.get(item.id)?.length ?? 0) > 0 ? (
                  <span className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-primary text-primary-foreground shadow-sm">
                    <Trophy className="h-2 w-2" aria-hidden />
                    <span className="sr-only">비교 연결된 사진</span>
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
