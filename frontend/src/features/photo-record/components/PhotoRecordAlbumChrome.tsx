import { ArrowLeft, Camera, ImagePlus, Map as MapIcon, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export type AlbumLayout = "story" | "map";

export function StoryEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="photo-record-story-surface relative flex min-h-[calc(100dvh-11rem)] items-center justify-center px-6 py-16 md:min-h-[34rem]">
      <div className="relative z-10 flex max-w-xs flex-col items-center gap-3 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-sm backdrop-blur">
          <Camera className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">사진이 없어요.</p>
          <p className="text-sm text-muted-foreground">사진을 추가해 주세요.</p>
        </div>
        <Button type="button" size="sm" onClick={onAdd}>
          <ImagePlus className="h-4 w-4" />
          사진 추가
        </Button>
      </div>
    </div>
  );
}

export function AlbumHeader({
  layout,
  compact,
  isManaging,
  onLayoutChange,
  onManageToggle,
}: {
  layout: AlbumLayout;
  compact: boolean;
  onLayoutChange: (layout: AlbumLayout) => void;
  isManaging: boolean;
  onManageToggle: () => void;
}) {
  return (
    <div
      className={
        compact
          ? "absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2"
          : "flex flex-wrap items-end justify-between gap-3"
      }
    >
      {compact ? (
        <Button
          asChild
          type="button"
          variant="secondary"
          size="icon"
          className="rounded-full bg-background/90 shadow-sm backdrop-blur"
          aria-label="마이로 돌아가기"
        >
          <Link to="/me">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <div>
          <h2 className="flex items-center gap-1.5 font-semibold">
            <Camera className="h-4 w-4 text-primary" /> 내 앨범
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            사진을 시간의 흐름과 장소의 기억으로 살펴보세요.
          </p>
        </div>
      )}
      <div
        className={`flex min-w-0 flex-nowrap items-center justify-end gap-2 ${compact ? "rounded-full bg-background/90 p-1 shadow-sm backdrop-blur" : ""}`}
      >
        <div
          className="inline-flex rounded-full bg-muted p-1 text-sm"
          aria-label="앨범 보기 방식"
        >
          <button
            type="button"
            onClick={() => onLayoutChange("story")}
            className={`rounded-full px-3 py-1.5 transition-colors ${layout === "story" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            스토리
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange("map")}
            className={`rounded-full px-3 py-1.5 transition-colors ${layout === "map" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <MapIcon className="mr-1 inline h-3.5 w-3.5" />맵
          </button>
        </div>
        {layout === "story" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageToggle}
          >
            {isManaging ? "완료" : "관리"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AlbumError({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return createPortal(
    <div
      role="alert"
      className="fixed inset-x-4 bottom-5 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background p-3 shadow-lg"
    >
      <p className="flex-1 text-sm">{message}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>,
    document.body,
  );
}
