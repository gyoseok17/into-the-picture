import { useState } from "react";
import { ImagePlus, MapPin, X } from "lucide-react";

import { getKoreaRegion } from "../lib/koreaRegions";
import { RegionCityPicker, type RegionSelection } from "./PhotoRegionField";

interface MapRegionPickerProps {
  region: NonNullable<ReturnType<typeof getKoreaRegion>>;
  selectedCityCode?: string | null;
  onChoose: (cityCode: string) => void;
  onAdd?: () => void;
}

export function MapRegionPicker({
  region,
  selectedCityCode,
  onChoose,
  onAdd,
}: MapRegionPickerProps) {
  const [isChoosing, setIsChoosing] = useState(false);

  return (
    <div
      className={`absolute inset-x-3 bottom-3 ${isChoosing ? "z-30" : "z-10"} sm:inset-x-auto sm:bottom-4 sm:left-4 sm:right-auto`}
    >
      <div className="flex items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setIsChoosing(true)}
          className="inline-flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="truncate">
            {selectedCityCode
              ? region.cities.find((city) => city.code === selectedCityCode)
                  ?.label
              : `${region.label} 지역 선택`}
          </span>
        </button>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedCityCode}
            title={selectedCityCode ? undefined : "시·군을 먼저 선택해 주세요."}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ImagePlus className="h-4 w-4" />
            사진 추가
          </button>
        ) : null}
      </div>
      {isChoosing ? (
        <div
          className="absolute inset-x-0 bottom-0 z-20 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border bg-background p-3 shadow-xl sm:bottom-full sm:top-auto sm:mb-2 sm:max-h-[calc(100cqh-5rem)] sm:overflow-y-auto sm:overscroll-contain"
          role="dialog"
          aria-label={`${region.label} 시군 선택`}
        >
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsChoosing(false)}
              aria-label="지역 선택 닫기"
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <RegionCityPicker
            region={region}
            selectedCityCode={selectedCityCode}
            onChoose={(cityCode) => {
              onChoose(cityCode);
              setIsChoosing(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export type { RegionSelection };
