/**
 * Viewports for the six selectable regions in album-map-korea-six-regions.svg.
 *
 * Values use the same 0–100 stage coordinate system as `albumMapCityPositions`.
 * They describe the full painted region, including separated island paths, not
 * merely the city-marker extent. Keep this catalog with the map artwork when
 * its paths are redrawn.
 */
export interface AlbumMapViewport {
  centerLeft: number
  centerTop: number
  scale: number
}

interface AlbumMapRegionBounds {
  minLeft: number
  maxLeft: number
  minTop: number
  maxTop: number
}

/** Full painted bounds for every selectable SVG region, including island paths. */
export const albumMapRegionBounds: Readonly<Record<string, AlbumMapRegionBounds>> = {
  CAPITAL: { minLeft: 14, maxLeft: 52, minTop: 11, maxTop: 49 },
  GANGWON: { minLeft: 38, maxLeft: 84, minTop: 2, maxTop: 49 },
  CHUNGCHEONG: { minLeft: 22, maxLeft: 68, minTop: 38, maxTop: 60 },
  JEOLLA: { minLeft: 8, maxLeft: 52, minTop: 55, maxTop: 91 },
  GYEONGSANG: { minLeft: 45, maxLeft: 86, minTop: 39, maxTop: 82 },
  JEJU: { minLeft: 23, maxLeft: 45, minTop: 84, maxTop: 95 },
}

const REGION_VIEWPORT_PADDING = 12
const MAX_REGION_VIEWPORT_SCALE = 2.2

/** Returns a padded, clamped viewport that keeps the whole selected artwork visible. */
export function getAlbumMapRegionViewport(regionCode?: string | null): AlbumMapViewport | undefined {
  if (!regionCode) return undefined
  const bounds = albumMapRegionBounds[regionCode]
  if (!bounds) return undefined

  const width = bounds.maxLeft - bounds.minLeft + REGION_VIEWPORT_PADDING
  const height = bounds.maxTop - bounds.minTop + REGION_VIEWPORT_PADDING
  const scale = clamp(Math.min(100 / width, 100 / height), 1, MAX_REGION_VIEWPORT_SCALE)

  return {
    centerLeft: clamp((bounds.minLeft + bounds.maxLeft) / 2, 0, 100),
    centerTop: clamp((bounds.minTop + bounds.maxTop) / 2, 0, 100),
    scale,
  }
}

/**
 * Shared by region framing and marker focus so SVG and markers always move
 * together. The consumer must set `transform-origin: 0 0`: for a center C and
 * scale S, `translate(50 - C*S) scale(S)` maps C exactly to the stage center.
 */
export function getAlbumMapViewportTransform(viewport?: AlbumMapViewport): string | undefined {
  if (!viewport) return undefined
  const scale = clamp(viewport.scale, 1, MAX_REGION_VIEWPORT_SCALE)
  const centerLeft = clamp(viewport.centerLeft, 0, 100)
  const centerTop = clamp(viewport.centerTop, 0, 100)
  return `translate(${50 - centerLeft * scale}%, ${50 - centerTop * scale}%) scale(${scale})`
}

export function getAlbumMapMarkerViewport(left: number, top: number, scale = 1.38): AlbumMapViewport {
  return { centerLeft: left, centerTop: top, scale }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
