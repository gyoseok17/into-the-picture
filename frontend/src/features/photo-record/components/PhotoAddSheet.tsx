import { useState } from "react";
import { createPortal } from "react-dom";

import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";
import type { PhotoRecordDraft } from "../types";
import { BatchPhotoUploadPanel } from "./BatchPhotoUploadPanel";

export function PhotoAddSheet({
  initialLocation,
  onClose,
  onComplete,
}: {
  initialLocation?: Pick<PhotoRecordDraft, "mapRegionCode" | "mapCityCode">;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  useDocumentScrollLock();
  const close = () => {
    if (!isUploading) onClose();
  };
  useEscapeDismiss(onClose, { enabled: !isUploading });
  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-black/25 p-3 sm:grid sm:place-items-center"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal
        aria-label="사진 추가"
        className="absolute inset-x-3 bottom-3 max-h-[90dvh] overflow-y-auto rounded-3xl border bg-background p-4 shadow-2xl sm:static sm:w-full sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="font-semibold">사진 추가</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            사진, 촬영일, 장소를 함께 기록해요.
          </p>
        </div>
        <BatchPhotoUploadPanel
          initialLocation={initialLocation}
          onUploadStateChange={setIsUploading}
          onComplete={onComplete}
        />
      </section>
    </div>,
    document.body,
  );
}
