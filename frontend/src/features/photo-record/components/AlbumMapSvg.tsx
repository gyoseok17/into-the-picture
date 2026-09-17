import type { MouseEvent } from 'react'

import albumMapMarkup from '@/assets/album-map-korea-six-regions.svg?raw'

interface AlbumMapSvgProps {
  selectedRegionCode?: string | null
  onChoose?: (regionCode: string) => void
  onBlankClick?: () => void
  interactive?: boolean
  className?: string
}

const regionPaths = {
  GYEONGSANG: [
    'fill="#C2D1BA" transform="translate(853,504)"',
    'fill="#C2D0BB" transform="translate(733,1081)"',
  ],
  CHUNGCHEONG: ['fill="#E4DEB7" transform="translate(513,500)"'],
  JEOLLA: [
    'fill="#C1D8D8" transform="translate(393.33203125,771.43359375)"',
    'fill="#C1D8D7" transform="translate(165,1139)"',
    'fill="#C1D7D6" transform="translate(226.1875,1228.4375)"',
    'fill="#C1D7D6" transform="translate(136,1091)"',
    'fill="#C1D7D7" transform="translate(143.3125,1010.6875)"',
    'fill="#C2D8D7" transform="translate(126.1328125,1063.6328125)"',
    'fill="#C4D1BC" transform="translate(503,1155)"',
    'fill="#C0D6D6" transform="translate(272,1221)"',
  ],
  GANGWON: ['fill="#C1D8D8" transform="translate(634,127)"'],
  CAPITAL: ['fill="#C4D8C4" transform="translate(369,209)"'],
  JEJU: ['fill="#C4D3B6" transform="translate(408,1315)"'],
} as const

/** The visible artwork and its selectable borders always share the same SVG path. */
export function AlbumMapSvg({
  selectedRegionCode,
  onChoose,
  onBlankClick,
  interactive = true,
  className = '',
}: AlbumMapSvgProps) {
  const scalableMarkup = albumMapMarkup.replace(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="1024" height="1536">',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet">',
  )
  const markup = Object.entries(regionPaths).reduce((svg, [code, paths]) => paths.reduce((nextSvg, attributes) => {
    const paintedAttributes = selectedRegionCode === code
      ? attributes.replace(/fill="#[0-9A-F]{6}"/, 'fill="#6f9c8e"')
      : attributes
    return nextSvg.replace(attributes, `${paintedAttributes} data-region-code="${code}"`)
  }, svg), scalableMarkup)

  const chooseRegion = (event: MouseEvent<HTMLDivElement>) => {
    if (!interactive || !(event.target instanceof Element)) return
    const code = event.target.closest<SVGPathElement>('[data-region-code]')?.dataset.regionCode
    if (code) onChoose?.(code)
    else onBlankClick?.()
  }

  return (
    <div
      className={`h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain ${interactive ? 'cursor-pointer' : ''} ${className}`}
      role={interactive ? 'group' : 'img'}
      aria-label="대한민국 여행 지역 지도"
      data-selected-region={selectedRegionCode ?? undefined}
      onClick={chooseRegion}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
