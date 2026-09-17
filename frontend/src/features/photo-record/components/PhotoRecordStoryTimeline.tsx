import type { ReactNode } from 'react'

import type { PhotoRecordBundle } from '../types'
import { storyCardPlacement } from '../lib/photoRecordAlbumPresentation'

export type PhotoRecordStoryGroup = {
  key: string
  label: string
  bundles: PhotoRecordBundle[]
}

export function PhotoRecordStoryTimeline({
  groups,
  immersive,
  renderBundle,
}: {
  groups: PhotoRecordStoryGroup[]
  immersive: boolean
  renderBundle: (bundle: PhotoRecordBundle, index: number) => ReactNode
}) {
  return (
    <div className={`photo-record-story-surface relative ${immersive ? 'mx-auto max-w-6xl space-y-40 sm:space-y-52' : 'space-y-36 sm:space-y-48'}`}>
      <svg aria-hidden preserveAspectRatio="none" viewBox="0 0 160 1000" className="pointer-events-none absolute left-1/2 top-4 z-0 h-[calc(100%_-_2rem)] w-44 -translate-x-1/2 overflow-visible text-zinc-400">
        <path d="M 80 0 C 20 64, 140 116, 78 198 S 24 340, 84 426 S 138 572, 76 662 S 22 836, 82 1000" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {groups.map((group, groupIndex) => (
        <section key={group.key} className="relative">
          <div className="relative z-10 flex flex-col items-center pt-1 text-center">
            <span className="font-handwritten text-base font-medium text-foreground">{group.label}</span>
          </div>
          <div className="relative z-10 pb-12 pt-5 sm:pb-16">
            <div className="relative flex flex-col items-center gap-6 sm:gap-10">
              {group.bundles.map((bundle, bundleIndex) => (
                <div key={bundle.id ?? bundle.photos[0]?.id ?? bundle.createdAt} className={`relative isolate w-[58vw] min-w-[13rem] max-w-[15rem] ${storyCardPlacement(groupIndex + bundleIndex)} sm:w-full sm:max-w-[17rem]`}>
                  {renderBundle(bundle, groupIndex + bundleIndex)}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
