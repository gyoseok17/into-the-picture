import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";

import { PhotoRegionField } from "./PhotoRegionField";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";
import type { PhotoRecordBundleDraft, PhotoRecordDraft } from "../types";
import { mapLocationLabel } from "../lib/photoUploadPresentation";

export function PhotoUploadLocationField({
  value,
  disabled,
  onOpen,
}: {
  value: PhotoRecordBundleDraft;
  disabled: boolean;
  onOpen: () => void;
}) {
  const label = mapLocationLabel(value);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/45 hover:bg-primary/[0.025] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">장소</span>
          <span
            className={`mt-0.5 block truncate text-xs ${label ? "text-muted-foreground" : "text-destructive"}`}
          >
            {label ?? "장소를 선택해 주세요."}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-sm font-medium text-primary">
        {label ? "변경" : "선택"}
      </span>
    </button>
  );
}

export function PhotoUploadLocationPicker({
  value,
  onChange,
  onClose,
  disabled,
}: {
  value: PhotoRecordBundleDraft;
  onChange: (
    value: Pick<PhotoRecordDraft, "mapRegionCode" | "mapCityCode">,
  ) => void;
  onClose: () => void;
  disabled: boolean;
}) {
  useDocumentScrollLock();
  const close = () => {
    if (!disabled) onClose();
  };
  useEscapeDismiss(onClose, {
    enabled: !disabled,
    capture: true,
    preventDefault: true,
    stopImmediatePropagation: true,
  });
  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-black/30 p-3 sm:grid sm:place-items-center"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal
        aria-label="장소 선택"
        className="absolute inset-x-3 bottom-3 max-h-[88dvh] overflow-y-auto rounded-3xl border bg-background p-4 shadow-2xl sm:static sm:w-full sm:max-w-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="font-semibold">장소 선택</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            권역과 시·군을 고르면 사진 추가 화면으로 돌아갑니다.
          </p>
        </div>
        <PhotoRegionField
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      </section>
    </div>,
    document.body,
  );
}
