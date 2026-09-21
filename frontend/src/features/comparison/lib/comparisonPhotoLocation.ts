import type { PhotoRecordBundle } from '@/features/photo-record/types'

/** The contest's verified map location. Missing values keep the picker unfiltered. */
export interface ComparisonTargetLocation {
  regionCode: string | null | undefined
  cityCode: string | null | undefined
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value?.trim())
}

/**
 * Narrows album candidates to the contest location without deriving a location
 * from display text. A verified city is preferred only when both sides have one.
 */
export function bundleMatchesComparisonTarget(
  bundle: Pick<PhotoRecordBundle, 'mapRegionCode' | 'mapCityCode'>,
  target: ComparisonTargetLocation | undefined,
): boolean {
  if (!target || !hasValue(target.regionCode)) return true
  if (bundle.mapRegionCode !== target.regionCode) return false

  return !hasValue(target.cityCode)
    || !hasValue(bundle.mapCityCode)
    || bundle.mapCityCode === target.cityCode
}

export function filterBundlesForComparisonTarget(
  bundles: PhotoRecordBundle[],
  target: ComparisonTargetLocation | undefined,
): PhotoRecordBundle[] {
  return bundles.filter((bundle) => bundleMatchesComparisonTarget(bundle, target))
}

export function hasComparisonTargetLocation(target: ComparisonTargetLocation | undefined): boolean {
  return Boolean(target && hasValue(target.regionCode))
}
