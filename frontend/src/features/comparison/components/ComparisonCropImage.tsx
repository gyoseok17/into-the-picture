import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '@/lib/apiClient'
import type { ComparisonCrop } from '../types'

const DEFAULT_ASPECT_RATIO = 4 / 3

export function comparisonCropOrDefault(crop?: ComparisonCrop | null): ComparisonCrop {
  return crop ?? { aspectRatio: DEFAULT_ASPECT_RATIO, zoom: 1, offsetX: 0, offsetY: 0 }
}

export function useResolvedComparisonImage(src: string) {
  const isPrivatePhoto = src.startsWith('/me/photos/')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isPrivatePhoto) {
      setObjectUrl(null)
      return
    }

    let active = true
    let url: string | null = null
    void apiClient.get<Blob>(src, { responseType: 'blob' }).then((response) => {
      url = URL.createObjectURL(response.data)
      if (active) setObjectUrl(url)
      else URL.revokeObjectURL(url)
    }).catch(() => {
      if (active) setObjectUrl(null)
    })

    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [isPrivatePhoto, src])

  return isPrivatePhoto ? objectUrl : src
}

export function useImageAspectRatio(src: string | undefined, fallback = DEFAULT_ASPECT_RATIO) {
  const resolvedSrc = useResolvedComparisonImage(src ?? '')
  const [aspectRatio, setAspectRatio] = useState(fallback)

  useEffect(() => {
    if (!resolvedSrc) return
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setAspectRatio(image.naturalWidth / image.naturalHeight)
      }
    }
    image.src = resolvedSrc
  }, [resolvedSrc])

  return aspectRatio
}

export function ComparisonCropImage({
  src,
  alt,
  crop,
  className = '',
  imageClassName = '',
}: {
  src: string
  alt: string
  crop?: ComparisonCrop | null
  className?: string
  imageClassName?: string
}) {
  const resolvedSrc = useResolvedComparisonImage(src)
  const sourceAspectRatio = useImageAspectRatio(src)
  const value = comparisonCropOrDefault(crop)
  const style = useMemo(
    () => cropImageStyle(value, sourceAspectRatio),
    [sourceAspectRatio, value.aspectRatio, value.offsetX, value.offsetY, value.zoom],
  )

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`} style={{ aspectRatio: value.aspectRatio }}>
      {resolvedSrc ? <img src={resolvedSrc} alt={alt} className={`absolute max-w-none select-none ${imageClassName}`} style={style} /> : null}
    </div>
  )
}

export function cropImageStyle(crop: ComparisonCrop, sourceAspectRatio: number): React.CSSProperties {
  const aspectRatio = positiveOr(crop.aspectRatio, DEFAULT_ASPECT_RATIO)
  const zoom = Math.max(1, crop.zoom || 1)
  const source = positiveOr(sourceAspectRatio, aspectRatio)
  const width = (source >= aspectRatio ? (source / aspectRatio) * 100 : 100) * zoom
  const height = (source >= aspectRatio ? 100 : (aspectRatio / source) * 100) * zoom
  const offsetX = clamp(crop.offsetX, -1, 1)
  const offsetY = clamp(crop.offsetY, -1, 1)

  return {
    width: `${width}%`,
    height: `${height}%`,
    left: `${(100 - width) / 2 + ((width - 100) / 2) * offsetX}%`,
    top: `${(100 - height) / 2 + ((height - 100) / 2) * offsetY}%`,
  }
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function positiveOr(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback
}
