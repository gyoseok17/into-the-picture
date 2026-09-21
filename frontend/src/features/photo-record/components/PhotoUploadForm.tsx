import { useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ImagePlus,
  RotateCcw,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PhotoRecordBundleDraft } from "../types";
import { useBatchPhotoUpload } from "../hooks/useBatchPhotoUpload";
import {
  ACCEPTED_PHOTO_IMAGES,
  type PhotoUploadItem,
} from "../types/photoUpload";
import {
  mapLocationLabel,
  photoDateSourceLabel,
  photoTakenAtLabel,
} from "../lib/photoUploadPresentation";
import {
  PhotoUploadLocationField,
  PhotoUploadLocationPicker,
} from "./PhotoUploadLocationPicker";

export function PhotoUploadForm({
  upload,
}: {
  upload: ReturnType<typeof useBatchPhotoUpload>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const {
    items,
    setItems,
    common,
    setCommon,
    isUploading,
    selectionNotice,
    needsCommonTakenAt,
    hasInvalidVisitPeriod,
    pendingCount,
    successCount,
    failedCount,
    selectFiles,
    uploadPending,
  } = upload;
  const changeCommon = (
    change: (current: PhotoRecordBundleDraft) => PhotoRecordBundleDraft,
  ) => setCommon(change);
  return (
    <Card className="space-y-5 border-0 bg-transparent p-0 shadow-none">
      <PhotoUploadLocationField
        value={common}
        disabled={isUploading}
        onOpen={() => setLocationOpen(true)}
      />
      <PhotoFileSelection
        items={items}
        isUploading={isUploading}
        inputRef={inputRef}
        datesOpen={datesOpen}
        onDatesToggle={() => setDatesOpen((current) => !current)}
        onFiles={(files) =>
          void selectFiles(files).finally(() => {
            if (inputRef.current) inputRef.current.value = "";
          })
        }
        onDateChange={(id, manualTakenAt) =>
          setItems((current) =>
            current.map((item) =>
              item.id === id ? { ...item, manualTakenAt } : item,
            ),
          )
        }
        fallbackTakenAt={common.takenAt}
      />
      {selectionNotice ? (
        <p
          role="status"
          className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {selectionNotice}
        </p>
      ) : null}
      {items.length ? (
        <>
          <PhotoUploadDetails
            value={common}
            disabled={isUploading}
            needsCommonTakenAt={needsCommonTakenAt}
            hasInvalidVisitPeriod={hasInvalidVisitPeriod}
            onChange={changeCommon}
          />
          <PhotoUploadSubmit
            total={items.length}
            successCount={successCount}
            failedCount={failedCount}
            pendingCount={pendingCount}
            uploading={isUploading}
            disabled={needsCommonTakenAt || hasInvalidVisitPeriod}
            onSubmit={() => void uploadPending()}
          />
        </>
      ) : null}
      {locationOpen ? (
        <PhotoUploadLocationPicker
          value={common}
          disabled={isUploading}
          onClose={() => setLocationOpen(false)}
          onChange={(region) => {
            setCommon((current) => {
              const next = { ...current, ...region };
              return { ...next, placeName: mapLocationLabel(next) };
            });
            if (region.mapRegionCode && region.mapCityCode)
              setLocationOpen(false);
          }}
        />
      ) : null}
    </Card>
  );
}

function PhotoFileSelection({
  items,
  isUploading,
  inputRef,
  datesOpen,
  onDatesToggle,
  onFiles,
  onDateChange,
  fallbackTakenAt,
}: {
  items: PhotoUploadItem[];
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  datesOpen: boolean;
  onDatesToggle: () => void;
  onFiles: (files: FileList | null) => void;
  onDateChange: (id: string, takenAt: string | null) => void;
  fallbackTakenAt?: string | null;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">사진</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            최대 3장 · 장당 10MB
          </p>
        </div>
        {items.length ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            사진 변경
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        multiple
        accept={ACCEPTED_PHOTO_IMAGES}
        disabled={isUploading}
        onChange={(event) => onFiles(event.target.files)}
      />
      {items.length ? (
        <>
          <SelectedPhotos items={items} fallbackTakenAt={fallbackTakenAt} />
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUploading}
            aria-expanded={datesOpen}
            onClick={onDatesToggle}
          >
            사진별 날짜 조정
            <ChevronDown
              className={`h-4 w-4 transition-transform ${datesOpen ? "rotate-180" : ""}`}
            />
          </button>
          {datesOpen ? (
            <PhotoDateAdjustments
              items={items}
              fallbackTakenAt={fallbackTakenAt}
              disabled={isUploading}
              onChange={onDateChange}
            />
          ) : null}
        </>
      ) : (
        <button
          type="button"
          className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-primary/[0.025] px-5 text-center transition-colors hover:bg-primary/[0.06]"
          onClick={() => inputRef.current?.click()}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="mt-3 text-sm font-medium">사진 고르기</span>
          <span className="mt-1 text-xs text-muted-foreground">
            여행에서 남긴 장면을 골라 주세요
          </span>
        </button>
      )}
    </section>
  );
}

function PhotoUploadDetails({
  value,
  disabled,
  needsCommonTakenAt,
  hasInvalidVisitPeriod,
  onChange,
}: {
  value: PhotoRecordBundleDraft;
  disabled: boolean;
  needsCommonTakenAt: boolean;
  hasInvalidVisitPeriod: boolean;
  onChange: (
    change: (current: PhotoRecordBundleDraft) => PhotoRecordBundleDraft,
  ) => void;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-medium">기록 더하기</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            촬영일과 메모는 이번 사진들에 공통으로 적용돼요.
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        시작일과 종료일은 이 장소에서 보낸 여행 기간이에요. 사진마다 찾은
        촬영일은 그대로 보관돼요.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          시작일
          <Input
            type="date"
            required={needsCommonTakenAt}
            aria-label="시작일"
            value={value.takenAt ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                takenAt: event.target.value,
                endedAt:
                  current.endedAt && current.endedAt < event.target.value
                    ? ""
                    : current.endedAt,
              }))
            }
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          <span>
            종료일 <span className="font-normal">(선택)</span>
          </span>
          <Input
            type="date"
            min={value.takenAt ?? undefined}
            aria-label="종료일"
            value={value.endedAt ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                endedAt: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          <span>
            메모 <span className="font-normal">(선택)</span>
          </span>
          <Input
            placeholder="사진에 남길 메모"
            value={value.memo ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({ ...current, memo: event.target.value }))
            }
          />
        </label>
      </div>
      {!needsCommonTakenAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          촬영일을 비워 두면 사진별 정보에서 읽은 날짜를 사용해요.
        </p>
      ) : (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          일부 사진에서 촬영일을 찾지 못했어요. 모든 사진에 적용할 촬영일을 직접
          입력해 주세요.
        </p>
      )}
      {hasInvalidVisitPeriod ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          종료일은 시작일보다 빠를 수 없어요. 시작일과 종료일을 확인해 주세요.
        </p>
      ) : null}
    </section>
  );
}

function PhotoUploadSubmit({
  total,
  successCount,
  failedCount,
  pendingCount,
  uploading,
  disabled,
  onSubmit,
}: {
  total: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  uploading: boolean;
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 py-3 backdrop-blur">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {uploadStatusLabel(
          total,
          successCount,
          failedCount,
          pendingCount,
          uploading,
        )}
      </p>
      {successCount === total ? (
        <Button type="button" size="sm">
          완료
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          disabled={!pendingCount || uploading || disabled}
          onClick={onSubmit}
        >
          {failedCount ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading
            ? "묶음 저장 중"
            : failedCount
              ? "사진 묶음 다시 저장"
              : "사진 묶음 저장"}
        </Button>
      )}
    </div>
  );
}
function SelectedPhotos({
  items,
  fallbackTakenAt,
}: {
  items: PhotoUploadItem[];
  fallbackTakenAt?: string | null;
}) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.slice(0, 6).map((item, index) => (
          <div
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-xl bg-muted"
          >
            <img
              src={item.previewUrl}
              alt={`${index + 1}번째 선택 사진`}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2 pb-1.5 pt-5 text-right text-[11px] text-white">
              {photoTakenAtLabel(item, fallbackTakenAt)}
            </div>
          </div>
        ))}
      </div>
      {items.length > 6 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          사진 {items.length - 6}장이 더 선택되어 있어요.
        </p>
      ) : null}
    </div>
  );
}
function PhotoDateAdjustments({
  items,
  fallbackTakenAt,
  disabled,
  onChange,
}: {
  items: PhotoUploadItem[];
  fallbackTakenAt?: string | null;
  disabled: boolean;
  onChange: (id: string, takenAt: string | null) => void;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border bg-muted/30 p-3">
      <p className="text-xs leading-5 text-muted-foreground">
        사진 정보에서 찾은 촬영일은 그대로 사용해요. 직접 지정한 날짜만 해당
        사진에 적용되고, 날짜가 없는 사진은 여행 시작일을 사용해요.
      </p>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-3 rounded-lg bg-background px-2.5 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">
              {index + 1}. {item.file.name}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {photoDateSourceLabel(item, fallbackTakenAt)}
            </p>
          </div>
          <Input
            type="date"
            aria-label={`${index + 1}번째 사진 촬영일 직접 지정`}
            value={item.manualTakenAt ?? ""}
            disabled={disabled}
            onChange={(event) => onChange(item.id, event.target.value || null)}
          />
        </div>
      ))}
    </div>
  );
}
function uploadStatusLabel(
  total: number,
  success: number,
  failed: number,
  pending: number,
  uploading: boolean,
) {
  return uploading
    ? `${success}/${total}장 저장 중`
    : failed
      ? `${failed}장 저장에 실패했어요.`
      : success === total
        ? `${success}장 저장 완료`
        : `${pending}장 저장 대기`;
}
