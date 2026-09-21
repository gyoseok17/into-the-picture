import { useRef } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBodyOverflowLock } from "@/hooks/useBodyOverflowLock";
import { useDialogFocusRestoration } from "@/hooks/useDialogFocusRestoration";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";
import { PublicContestComparisonGallery } from "@/features/comparison/components/PublicContestComparisonGallery";
import type { PublicContestComparison } from "@/features/comparison/types";

export function PublicComparisonDialog({
  comparisons,
  isLoading,
  error,
  onRetry,
  onClose,
  contestImageUrl,
  contestTitle,
}: {
  comparisons: PublicContestComparison[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onClose: () => void;
  contestImageUrl: string;
  contestTitle: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useBodyOverflowLock();
  useDialogFocusRestoration(dialogRef);
  useEscapeDismiss(onClose, { preventDefault: true });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 sm:p-6"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-comparison-dialog-title"
        tabIndex={-1}
        className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-background p-5 shadow-2xl outline-none sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">사진 비교</p>
            <h2
              id="public-comparison-dialog-title"
              className="text-lg font-semibold"
            >
              수상작과 비교한 사진
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="수상작과 비교한 사진 닫기"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <PublicContestComparisonGallery
          comparisons={comparisons}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          contestImageUrl={contestImageUrl}
          contestTitle={contestTitle}
          compact
        />
      </div>
    </div>
  );
}
