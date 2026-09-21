import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { AspectImage } from "@/components/AspectImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";
import {
  normalizeDraft,
  toDateTimeInput,
} from "../lib/photoRecordAlbumPresentation";
import type { PhotoDisplayMode, PhotoRecord, PhotoRecordDraft } from "../types";

export function PhotoRecordEditorDialog({
  record,
  pending,
  deleting,
  onClose,
  onSave,
  onDelete,
}: {
  record: PhotoRecord;
  pending: boolean;
  deleting: boolean;
  onClose: () => void;
  onSave: (
    draft: PhotoRecordDraft & { displayMode?: PhotoDisplayMode },
  ) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<PhotoRecordDraft>({
    takenAt: record.takenAt,
    placeName: record.placeName,
    memo: record.memo,
  });
  const [displayMode, setDisplayMode] = useState<PhotoDisplayMode>(
    record.displayMode,
  );
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useDocumentScrollLock();
  useEffect(() => {
    closeButton.current?.focus();
  }, []);
  useEscapeDismiss(onClose);

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="photo-record-editor-title"
      className="fixed inset-0 z-[70] flex items-end bg-black/45 p-3 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <Card
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="photo-record-editor-title" className="font-semibold">
              사진 기록 수정
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              비어 있는 값은 ‘미상’으로 표시돼요.
            </p>
          </div>
          <Button
            ref={closeButton}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="닫기"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AspectImage
          src={record.url}
          alt={record.originalFilename ?? "내 사진"}
          className="mt-4 rounded-lg"
          ratioClassName="aspect-[4/3]"
        />
        <div className="mt-4 space-y-3">
          <label className="space-y-1 text-sm font-medium">
            촬영일
            <Input
              type="datetime-local"
              value={toDateTimeInput(draft.takenAt)}
              onChange={(event) =>
                setDraft((value) => ({ ...value, takenAt: event.target.value }))
              }
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            장소
            <Input
              placeholder="장소 미상"
              value={draft.placeName ?? ""}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  placeName: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            메모
            <textarea
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="남기고 싶은 이야기를 적어 보세요."
              value={draft.memo ?? ""}
              onChange={(event) =>
                setDraft((value) => ({ ...value, memo: event.target.value }))
              }
            />
          </label>
          {record.contestId ? (
            <label className="space-y-1 text-sm font-medium">
              비교 장면 표시
              <Select
                value={displayMode}
                onValueChange={(value: PhotoDisplayMode) =>
                  setDisplayMode(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITH_CONTEST">
                    수상작과 함께 보기
                  </SelectItem>
                  <SelectItem value="PHOTO_ONLY">내 사진만 보기</SelectItem>
                </SelectContent>
              </Select>
            </label>
          ) : null}
        </div>
        {isDeleteConfirming ? (
          <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium">이 사진을 삭제할까요?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              사진 기록과 원본 파일을 함께 지웁니다. 비교에 사용 중인 사진은
              먼저 비교 결과를 삭제해야 해요.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => setIsDeleteConfirming(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? "삭제 중…" : "사진 삭제"}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteConfirming(true)}
            disabled={pending || deleting}
          >
            사진 삭제
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending || deleting}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() =>
                onSave({
                  ...normalizeDraft(draft),
                  ...(record.contestId ? { displayMode } : {}),
                })
              }
              disabled={pending || deleting}
            >
              {pending ? "저장 중…" : "저장"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
