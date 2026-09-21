import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import type { PhotoComparison } from "@/features/comparison/types";
import { getKoreaCity, getKoreaRegion } from "../lib/koreaRegions";
import {
  getPhotoRecordMapStageSize,
  groupPhotoRecordMapPins,
  pinMatchesRegion,
} from "../lib/photoRecordMapPresentation";
import {
  getAlbumMapMarkerViewport,
  getAlbumMapRegionViewport,
  getAlbumMapViewportTransform,
} from "../lib/albumMapRegionViewport";
import type { PhotoRecordBundleMapPin } from "../types";
import type { PhotoRecordMapPinGroup, PhotoRecordMapStageSize } from "../types/photoRecordMap";
import { AlbumMapSvg } from "./AlbumMapSvg";
import { MapFocus } from "./MapFocus";
import { MapRegionPicker, type RegionSelection } from "./MapRegionPicker";

interface PhotoRecordMapViewProps {
  pins: PhotoRecordBundleMapPin[];
  comparisons: PhotoComparison[];
  unplacedCount: number;
  immersive?: boolean;
  onAdd?: (initialLocation: RegionSelection) => void;
}

export function PhotoRecordMapView({
  pins,
  comparisons,
  unplacedCount: _unplacedCount,
  immersive = false,
  onAdd,
}: PhotoRecordMapViewProps) {
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<PhotoRecordMapStageSize | null>(null);
  const [regionFilter, setRegionFilter] = useState<RegionSelection>({});
  const [focusedGroup, setFocusedGroup] = useState<PhotoRecordMapPinGroup | null>(null);
  const [focusedRecordIndex, setFocusedRecordIndex] = useState(0);

  const filteredPins = useMemo(
    () =>
      pins.filter((pin) => {
        if (
          regionFilter.mapRegionCode &&
          !pinMatchesRegion(pin, regionFilter.mapRegionCode)
        )
          return false;
        return !regionFilter.mapCityCode || pin.mapCityCode === regionFilter.mapCityCode;
      }),
    [pins, regionFilter],
  );
  const groups = useMemo(() => groupPhotoRecordMapPins(filteredPins), [filteredPins]);
  const region = getKoreaRegion(regionFilter.mapRegionCode);
  const city = getKoreaCity(regionFilter.mapRegionCode, regionFilter.mapCityCode);

  useEffect(() => {
    if (!focusedGroup) return;
    const updatedGroup = groups.find((group) => group.id === focusedGroup.id);
    if (!updatedGroup) {
      setFocusedGroup(null);
      setFocusedRecordIndex(0);
    } else if (updatedGroup !== focusedGroup) {
      setFocusedGroup(updatedGroup);
    }
  }, [focusedGroup, groups]);

  useLayoutEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) return;

    const updateStageSize = () => {
      const next = getPhotoRecordMapStageSize(
        viewport.clientWidth,
        viewport.clientHeight,
      );
      setStageSize((current) =>
        current?.width === next.width && current.height === next.height
          ? current
          : next,
      );
    };

    updateStageSize();
    const observer = new ResizeObserver(updateStageSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const clearSelection = () => {
    setRegionFilter({});
    setFocusedGroup(null);
    setFocusedRecordIndex(0);
  };
  const focusGroup = (group: PhotoRecordMapPinGroup) => {
    setFocusedGroup(group);
    const representativeIndex = group.pins.findIndex((pin) => pin.representative);
    setFocusedRecordIndex(representativeIndex >= 0 ? representativeIndex : 0);
  };
  const mapViewport = focusedGroup
    ? getAlbumMapMarkerViewport(focusedGroup.left, focusedGroup.top)
    : getAlbumMapRegionViewport(regionFilter.mapRegionCode);

  return (
    <div
      ref={mapViewportRef}
      className={`relative overflow-hidden bg-[#f4f8f5] [container-type:size] ${immersive ? "h-[calc(100dvh-4rem)] min-h-[34rem] rounded-none border-y" : "h-[calc(100dvh-13rem)] min-h-[32rem] rounded-2xl border shadow-sm"}`}
    >
      <div className="grid h-full w-full place-items-center">
        {stageSize ? (
          <div className="relative" style={{ width: stageSize.width, height: stageSize.height }}>
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out"
              style={{
                transform: getAlbumMapViewportTransform(mapViewport),
                transformOrigin: "0 0",
              }}
            >
              <div className="absolute inset-0 z-[1]">
                <AlbumMapSvg
                  selectedRegionCode={regionFilter.mapRegionCode}
                  onChoose={(mapRegionCode) => {
                    if (regionFilter.mapRegionCode === mapRegionCode) clearSelection();
                    else {
                      setRegionFilter({ mapRegionCode });
                      setFocusedGroup(null);
                      setFocusedRecordIndex(0);
                    }
                  }}
                  onBlankClick={clearSelection}
                  className="h-full max-w-none"
                />
              </div>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    focusGroup(group);
                  }}
                  className="group absolute z-[2] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ left: `${group.left}%`, top: `${group.top}%` }}
                  aria-label={`${group.pins[0].placeName} 방문 기록 ${group.pins.length}개 보기`}
                >
                  <span
                    className={`grid h-6 min-w-6 place-items-center rounded-full border-2 border-background px-1 text-[10px] font-semibold text-primary-foreground shadow-md transition-transform group-hover:scale-110 ${focusedGroup?.id === group.id ? "scale-110 bg-primary ring-2 ring-primary/20" : "bg-primary"}`}
                  >
                    {group.pins.length > 1 ? group.pins.length : <MapPin className="h-3 w-3" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {region ? (
        <MapRegionPicker
          region={region}
          selectedCityCode={regionFilter.mapCityCode}
          onAdd={() => onAdd?.(regionFilter)}
          onChoose={(mapCityCode) => {
            setRegionFilter({ mapRegionCode: region.code, mapCityCode });
            setFocusedGroup(null);
            setFocusedRecordIndex(0);
          }}
        />
      ) : null}
      {filteredPins.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex justify-center">
          <span className="rounded-full bg-background/90 px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
            {city && region ? `${region.label} ${city.label}에 표시할 사진이 없어요.` : "표시할 장소가 없어요."}
          </span>
        </div>
      ) : null}
      {focusedGroup ? (
        <MapFocus
          group={focusedGroup}
          comparisons={comparisons}
          recordIndex={focusedRecordIndex}
          onRecordIndexChange={setFocusedRecordIndex}
          onClose={() => {
            setFocusedGroup(null);
            setFocusedRecordIndex(0);
          }}
        />
      ) : null}
    </div>
  );
}
