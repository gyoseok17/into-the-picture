import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Search } from 'lucide-react'

import { koreaRegions } from '../lib/koreaRegions'
import { useMapLocationOptions } from '../hooks/usePhotoRecords'

export interface RegionSelection {
  mapRegionCode?: string | null
  mapCityCode?: string | null
}

/**
 * Region → city selection used by every photo-record location flow.
 * The map owns region selection visually; sheets use the same city picker as
 * the map without embedding another interactive map in a modal.
 */
export function PhotoRegionField({
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: RegionSelection
  onChange: (value: RegionSelection) => void
  disabled?: boolean
  compact?: boolean
}) {
  const [regionCode, setRegionCode] = useState<string | null>(value.mapRegionCode ?? null)
  const locationOptions = useMapLocationOptions()
  // Offline/temporary API failure should not block selecting a location during upload.
  const regions = locationOptions.data ?? koreaRegions
  const activeRegion = regions.find((region) => region.code === regionCode)

  useEffect(() => {
    setRegionCode(value.mapRegionCode ?? null)
  }, [value.mapRegionCode])

  return (
    <div className={compact ? '' : 'rounded-xl border bg-background/70 p-3'}>
      {!activeRegion ? (
        <>
          <div>
            <p className="text-sm font-medium">권역 고르기</p>
            {!compact ? <p className="mt-0.5 text-xs text-muted-foreground">먼저 사진을 기록할 권역을 선택하세요.</p> : null}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {regions.map((region) => (
              <button
                key={region.code}
                type="button"
                disabled={disabled}
                onClick={() => setRegionCode(region.code)}
                className="rounded-xl border bg-background px-3 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-60"
              >
                {region.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled}
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:pointer-events-none"
            onClick={() => setRegionCode(null)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />권역 다시 고르기
          </button>
          <RegionCityPicker
            region={activeRegion}
            selectedCityCode={value.mapCityCode}
            disabled={disabled}
            onChoose={(mapCityCode) => onChange({ mapRegionCode: activeRegion.code, mapCityCode })}
          />
        </>
      )}
    </div>
  )
}

export function RegionCityPicker({
  region,
  selectedCityCode,
  onChoose,
  disabled = false,
}: {
  region: { code: string; label: string; cities: Array<{ code: string; label: string }> }
  selectedCityCode?: string | null
  onChoose: (cityCode: string) => void
  disabled?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const cities = useMemo(() => {
    const search = searchTerm.trim().replace(/\s/g, '')
    return search ? region.cities.filter((city) => city.label.replace(/\s/g, '').includes(search)) : region.cities
  }, [region, searchTerm])

  useEffect(() => setSearchTerm(''), [region.code])

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{region.label} 지역 선택</p>
        <span className="text-xs text-muted-foreground">{region.cities.length}곳</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">시·군 이름으로 찾아 선택하세요.</p>
      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchTerm}
          disabled={disabled}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="시·군 이름 검색"
          className="h-10 w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      {cities.length ? (
        <div className="mt-3 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {cities.map((city) => (
            <button
              key={city.code}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(city.code)}
              className={`rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none ${selectedCityCode === city.code ? 'border-primary bg-primary/10 text-primary' : ''}`}
            >
              {city.label}
            </button>
          ))}
        </div>
      ) : <p className="py-5 text-center text-sm text-muted-foreground">일치하는 시·군이 없습니다.</p>}
    </div>
  )
}
