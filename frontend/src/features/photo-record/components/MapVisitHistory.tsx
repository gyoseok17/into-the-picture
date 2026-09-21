import { useState } from "react";
import { X } from "lucide-react";

import { AspectImage } from "@/components/AspectImage";
import { useSetPhotoRecordMapRepresentative } from "../hooks/usePhotoRecords";
import { formatPhotoVisitPeriod } from "../lib/formatPhotoVisitPeriod";
import { formatTakenAt } from "../lib/photoRecordAlbumPresentation";
import type { PhotoRecordBundleMapPin } from "../types";

interface MapVisitHistoryProps {
  records: Array<{ item: PhotoRecordBundleMapPin; index: number }>;
  onChoose: (index: number) => void;
  onClose: () => void;
}

export function MapVisitHistory({
  records,
  onChoose,
  onClose,
}: MapVisitHistoryProps) {
  const setRepresentative = useSetPhotoRecordMapRepresentative();
  const [representativePhotoId, setRepresentativePhotoId] = useState<
    number | null
  >(
    () =>
      records.find(({ item }) => item.representative)?.item.photos[0]?.id ??
      null,
  );

  const chooseRepresentative = (item: PhotoRecordBundleMapPin) => {
    const photoRecordId = item.photos[0]?.id;
    if (
      !photoRecordId ||
      representativePhotoId === photoRecordId ||
      setRepresentative.isPending
    )
      return;
    setRepresentative.mutate(photoRecordId, {
      onSuccess: () => setRepresentativePhotoId(photoRecordId),
    });
  };

  return (
    <div
      className="absolute inset-0 z-30 bg-black/20 sm:bg-transparent"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal
        aria-label="방문 내역"
        className="absolute inset-x-0 bottom-0 max-h-[78%] overflow-y-auto rounded-t-3xl border bg-background p-4 shadow-2xl sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[25rem] sm:max-h-none sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">이곳의 기록</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              사진을 누르면 지도에서 해당 기록을 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="방문 내역 닫기"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {records.map(({ item, index }) => {
            const photoRecordId = item.photos[0]?.id;
            const representative =
              item.representative || representativePhotoId === photoRecordId;

            return (
              <article
                key={item.id ?? `legacy-${photoRecordId}`}
                className="flex items-center gap-3 rounded-xl border p-2.5"
              >
                <button
                  type="button"
                  onClick={() => onChoose(index)}
                  className="min-w-0 flex flex-1 items-center gap-3 text-left"
                >
                  <AspectImage
                    src={item.photos[0]?.url ?? ""}
                    alt=""
                    ratioClassName="aspect-square"
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {item.placeName}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatPhotoVisitPeriod(item.takenAt, item.endedAt) ??
                        formatTakenAt(item.takenAt) ??
                        "촬영일 미상"}{" "}
                      · 사진 {item.photos.length}장
                    </span>
                  </span>
                </button>
                {representative ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    대표
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => chooseRepresentative(item)}
                    disabled={setRepresentative.isPending}
                    className="shrink-0 rounded-full border border-primary/25 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-60"
                  >
                    대표로 설정
                  </button>
                )}
              </article>
            );
          })}
        </div>
        {setRepresentative.isError ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            대표 기록으로 설정하지 못했어요. 다시 시도해 주세요.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
