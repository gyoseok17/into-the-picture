import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { isAppError } from "@/lib/apiClient";
import { useComparisons } from "@/features/comparison/hooks/useComparison";
import type { PhotoComparison } from "@/features/comparison/types";
import { bundleKey, groupBundles } from "../lib/photoRecordAlbumPresentation";
import type {
  PhotoRecord,
  PhotoRecordDraft,
  PhotoRecordBundle,
} from "../types";
import {
  useDeletePhotoRecord,
  useDeletePhotoRecordBundle,
  usePhotoRecordBundleMap,
  usePhotoRecordBundles,
  useUpdatePhotoRecord,
} from "../hooks/usePhotoRecords";
import { AlbumComparisonPicker } from "./AlbumComparisonPicker";
import { PhotoAddSheet } from "./PhotoAddSheet";
import {
  AlbumError,
  AlbumHeader,
  type AlbumLayout,
  StoryEmptyState,
} from "./PhotoRecordAlbumChrome";
import {
  PhotoRecordBundleCard,
  StoryComparisonMarker,
} from "./PhotoRecordBundleCard";
import { PhotoRecordBundleLightbox } from "./PhotoRecordBundleLightbox";
import { PhotoRecordEditorDialog } from "./PhotoRecordEditorDialog";
import { PhotoRecordMapView } from "./PhotoRecordMapView";
import { PhotoRecordStoryTimeline } from "./PhotoRecordStoryTimeline";

function getConnectedPhotoCount(
  bundle: PhotoRecordBundle,
  comparisonsByPhotoId: Map<number, PhotoComparison[]>,
) {
  return bundle.photos.filter(
    (photo) => (comparisonsByPhotoId.get(photo.id)?.length ?? 0) > 0,
  ).length;
}

/** Coordinates album route state and dialog entry points. Rendering lives in focused child views. */
export function PhotoRecordAlbum({
  immersive = false,
}: {
  immersive?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const comparisonContestId = Number(searchParams.get("contestId")) || 0;
  const [layout, setLayout] = useState<AlbumLayout>("story");
  const [photoAddRequest, setPhotoAddRequest] = useState<{
    initialLocation?: Pick<PhotoRecordDraft, "mapRegionCode" | "mapCityCode">;
    resumeComparisonContestId?: number;
  } | null>(null);
  const [editing, setEditing] = useState<PhotoRecord | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState<string | null>(
    null,
  );
  const [storyPreview, setStoryPreview] = useState<PhotoRecordBundle | null>(
    null,
  );
  const bundles = usePhotoRecordBundles();
  const comparisons = useComparisons();
  const map = usePhotoRecordBundleMap(layout === "map");
  const update = useUpdatePhotoRecord();
  const remove = useDeletePhotoRecord();
  const removeBundle = useDeletePhotoRecordBundle();

  const comparisonsByPhotoId = useMemo(
    () => indexComparisonsByPhoto(comparisons.data ?? []),
    [comparisons.data],
  );
  const existingComparison = comparisons.data?.find(
    (comparison) => comparison.contest.id === comparisonContestId,
  );
  const groupedBundles = useMemo(
    () => groupBundles(bundles.data ?? [], "time"),
    [bundles.data],
  );
  const hasNoBundles = groupedBundles.length === 0;
  const isEmptyActiveStory = layout === "story" && hasNoBundles;

  const closeComparisonPicker = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("contestId");
    setSearchParams(next, { replace: true });
  };
  useEffect(() => {
    if (comparisonContestId && existingComparison) closeComparisonPicker();
  }, [comparisonContestId, existingComparison]);

  const toggleSelected = (key: string) =>
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const changeLayout = (nextLayout: AlbumLayout) => {
    setLayout(nextLayout);
    setIsManaging(false);
    setSelectedItems(new Set());
  };
  const deleteSelected = async () => {
    if (
      !selectedItems.size ||
      !window.confirm(
        `${selectedItems.size}개 기록을 삭제할까요? 비교에 사용 중인 사진이 포함되면 해당 기록은 유지됩니다.`,
      )
    )
      return;
    const selected = (bundles.data ?? []).filter((bundle) =>
      selectedItems.has(bundleKey(bundle)),
    );
    const result = await deleteAlbumBundles(
      selected,
      removeBundle.mutateAsync,
      remove.mutateAsync,
    );
    setSelectedItems(
      (current) =>
        new Set([...current].filter((key) => !result.deletedKeys.has(key))),
    );
    setBulkDeleteMessage(
      bulkDeleteResultMessage(
        result.deletedKeys.size,
        result.conflicts,
        result.failures,
      ),
    );
    if (selected.length > 0 && result.deletedKeys.size === selected.length)
      setIsManaging(false);
    remove.reset();
    removeBundle.reset();
  };

  const immersiveMap = immersive && layout === "map";
  const immersiveStory = immersive && layout === "story";
  const sectionClass = immersive
    ? `relative left-1/2 w-screen -translate-x-1/2 -mt-6 min-h-[calc(100dvh-4rem)] bg-[#f4f8f5] md:-mt-9 ${immersiveMap ? "" : `space-y-5 px-4 pb-10 ${immersiveStory ? "pt-16" : "pt-20"} md:px-8`}`
    : "space-y-4";

  return (
    <>
      <section className={sectionClass}>
        <AlbumHeader
          layout={layout}
          compact={immersive}
          onLayoutChange={changeLayout}
          isManaging={isManaging}
          onManageToggle={() => {
            setIsManaging((current) => !current);
            setSelectedItems(new Set());
          }}
        />
        {bundles.isPending ? (
          <LoadingState label="내 사진 기록을 불러오는 중…" />
        ) : null}
        {bundles.isError ? (
          <ErrorState
            error={bundles.error}
            onRetry={() => void bundles.refetch()}
          />
        ) : null}
        {layout === "map" && map.isPending ? (
          <LoadingState label="사진의 장소를 지도에 준비하는 중이에요." />
        ) : null}
        {layout === "map" && map.isError ? (
          <ErrorState error={map.error} onRetry={() => void map.refetch()} />
        ) : null}
        {!bundles.isPending && !bundles.isError && isEmptyActiveStory ? (
          <StoryEmptyState onAdd={() => setPhotoAddRequest({})} />
        ) : null}
        {!bundles.isPending &&
        !bundles.isError &&
        layout !== "map" &&
        !isEmptyActiveStory &&
        hasNoBundles ? (
          <EmptyState
            title="아직 남긴 사진이 없어요"
            description="여행에서 남긴 장면을 바로 추가해 보세요."
          />
        ) : null}
        {layout === "map" && !map.isPending && !map.isError ? (
          <PhotoRecordMapView
            pins={map.data ?? []}
            comparisons={comparisons.data ?? []}
            unplacedCount={unplacedPhotoCount(
              bundles.data ?? [],
              map.data ?? [],
            )}
            immersive={immersiveMap}
            onAdd={(initialLocation) => setPhotoAddRequest({ initialLocation })}
          />
        ) : null}
        {bulkDeleteMessage ? (
          <BulkDeleteResult
            message={bulkDeleteMessage}
            onClose={() => setBulkDeleteMessage(null)}
          />
        ) : null}
        {layout === "story" ? (
          <PhotoRecordStoryTimeline
            groups={groupedBundles}
            immersive={immersive}
            renderBundle={(bundle) => (
              <StoryBundle
                bundle={bundle}
                comparisonsByPhotoId={comparisonsByPhotoId}
                updating={update.isPending}
                selecting={isManaging}
                selected={selectedItems.has(bundleKey(bundle))}
                onSelect={() => toggleSelected(bundleKey(bundle))}
                onEdit={() => bundle.legacy && setEditing(bundle.photos[0])}
                onOpen={() => !isManaging && setStoryPreview(bundle)}
              />
            )}
          />
        ) : null}
        {update.isError || remove.isError || removeBundle.isError ? (
          <AlbumError
            message={
              remove.isError || removeBundle.isError
                ? deleteErrorMessage(remove.error ?? removeBundle.error)
                : "사진 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요."
            }
            onClose={() => {
              update.reset();
              remove.reset();
              removeBundle.reset();
            }}
          />
        ) : null}
      </section>
      {layout === "story" && isManaging && selectedItems.size ? (
        <SelectionBar
          count={selectedItems.size}
          pending={remove.isPending || removeBundle.isPending}
          onDelete={() => void deleteSelected()}
        />
      ) : null}
      {storyPreview ? (
        <PhotoRecordBundleLightbox
          bundle={storyPreview}
          comparisonsByPhotoId={comparisonsByPhotoId}
          onClose={() => setStoryPreview(null)}
        />
      ) : null}
      {editing ? (
        <PhotoRecordEditorDialog
          record={editing}
          pending={update.isPending}
          deleting={remove.isPending}
          onClose={() => setEditing(null)}
          onSave={(draft) =>
            update.mutate(
              { id: editing.id, update: draft },
              { onSuccess: () => setEditing(null) },
            )
          }
          onDelete={() =>
            remove.mutate(editing.id, { onSuccess: () => setEditing(null) })
          }
        />
      ) : null}
      {comparisonContestId && !existingComparison ? (
        <AlbumComparisonPicker
          contestId={comparisonContestId}
          bundles={bundles.data ?? []}
          onClose={closeComparisonPicker}
          onAddPhoto={(initialLocation) => {
            closeComparisonPicker();
            setPhotoAddRequest({
              initialLocation,
              resumeComparisonContestId: comparisonContestId,
            });
          }}
        />
      ) : null}
      {layout === "story" && !isManaging && !isEmptyActiveStory ? (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 h-9 w-9 rounded-full shadow-lg md:bottom-6 md:right-6"
          onClick={() => setPhotoAddRequest({})}
          aria-label="사진 추가"
          title="사진 추가"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">사진 추가</span>
        </Button>
      ) : null}
      {photoAddRequest ? (
        <PhotoAddSheet
          initialLocation={photoAddRequest.initialLocation}
          onClose={() => setPhotoAddRequest(null)}
          onComplete={() => {
            const resumeComparisonContestId = photoAddRequest.resumeComparisonContestId;
            setPhotoAddRequest(null);
            if (!resumeComparisonContestId) return;
            const next = new URLSearchParams(searchParams);
            next.set("contestId", String(resumeComparisonContestId));
            setSearchParams(next, { replace: true });
          }}
        />
      ) : null}
    </>
  );
}

function StoryBundle({
  bundle,
  comparisonsByPhotoId,
  updating,
  selecting,
  selected,
  onSelect,
  onEdit,
  onOpen,
}: {
  bundle: PhotoRecordBundle;
  comparisonsByPhotoId: Map<number, PhotoComparison[]>;
  updating: boolean;
  selecting: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <>
      <>
        {bundle.photos.length > 1 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-1 z-0 translate-x-2 translate-y-2 rotate-[-1.1deg] bg-white shadow-[0_3px_10px_rgba(40,55,48,0.08)]"
          />
        ) : null}
        {bundle.photos.length > 2 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-1 z-0 -translate-x-2 translate-y-4 rotate-[1deg] bg-white shadow-[0_3px_10px_rgba(40,55,48,0.06)]"
          />
        ) : null}
      </>
      <StoryComparisonMarker
        connectedPhotoCount={getConnectedPhotoCount(
          bundle,
          comparisonsByPhotoId,
        )}
      />
      <div className="relative z-10 bg-white p-2 pb-6 shadow-[0_4px_14px_rgba(40,55,48,0.10)]">
        <PhotoRecordBundleCard
          bundle={bundle}
          updating={updating}
          selecting={selecting}
          selected={selected}
          onSelect={onSelect}
          onEdit={onEdit}
          onOpen={onOpen}
          comparisonsByPhotoId={comparisonsByPhotoId}
          storyOnly
        />
      </div>
    </>
  );
}

function SelectionBar({
  count,
  pending,
  onDelete,
}: {
  count: number;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur md:bottom-6">
      <span className="text-sm font-medium">{count}개 선택</span>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onDelete}
      >
        선택 삭제
      </Button>
    </div>
  );
}
function BulkDeleteResult({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      className="mx-auto max-w-6xl rounded-xl border bg-background/95 px-3 py-2 text-sm shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}
function indexComparisonsByPhoto(comparisons: PhotoComparison[]) {
  const indexed = new Map<number, PhotoComparison[]>();
  for (const comparison of comparisons) {
    const connected = indexed.get(comparison.userPhoto.id) ?? [];
    connected.push(comparison);
    indexed.set(comparison.userPhoto.id, connected);
  }
  return indexed;
}
function unplacedPhotoCount(
  bundles: PhotoRecordBundle[],
  pins: Array<{ photos: unknown[] }>,
) {
  return Math.max(
    0,
    bundles.reduce((count, bundle) => count + bundle.photos.length, 0) -
      pins.reduce((count, pin) => count + pin.photos.length, 0),
  );
}
async function deleteAlbumBundles(
  bundles: PhotoRecordBundle[],
  removeBundle: (id: number) => Promise<unknown>,
  removePhoto: (id: number) => Promise<unknown>,
) {
  const deletedKeys = new Set<string>();
  let conflicts = 0;
  let failures = 0;
  for (const bundle of bundles) {
    try {
      if (bundle.id) await removeBundle(bundle.id);
      else await removePhoto(bundle.photos[0].id);
      deletedKeys.add(bundleKey(bundle));
    } catch (error) {
      if (
        isAppError(error) &&
        (error.status === 409 || error.code === "CONFLICT")
      )
        conflicts += 1;
      else failures += 1;
    }
  }
  return { deletedKeys, conflicts, failures };
}
function deleteErrorMessage(error: unknown): string {
  return isAppError(error) &&
    (error.status === 409 || error.code === "CONFLICT")
    ? "비교 결과에 사용 중인 사진은 삭제할 수 없어요. 비교 화면에서 결과를 먼저 삭제해 주세요."
    : "사진을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
function bulkDeleteResultMessage(
  deleted: number,
  conflicts: number,
  failures: number,
): string {
  return [
    `${deleted}개 삭제 완료`,
    ...(conflicts ? [`비교에 사용 중인 ${conflicts}개는 유지됨`] : []),
    ...(failures ? [`${failures}개 삭제 실패`] : []),
  ].join(" · ");
}
