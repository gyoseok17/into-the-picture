import { useEffect, useState } from 'react'

import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

interface AspectImageProps {
  src: string
  alt: string
  // 종횡비 고정으로 레이아웃 시프트 방지(기본 4:3).
  ratioClassName?: string
  fit?: 'cover' | 'contain'
  className?: string
}

// 이미지 lazy load + 종횡비 고정 공용 컴포넌트(카드·상세 공통).
export function AspectImage({
  src,
  alt,
  ratioClassName = 'aspect-[4/3]',
  fit = 'cover',
  className,
}: AspectImageProps) {
  return (
    <div className={cn('overflow-hidden bg-muted', ratioClassName, className)}>
      <ImageSource src={src} alt={alt} className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain')} />
    </div>
  )
}

export function ImageSource({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const isPrivatePhoto = src.startsWith('/me/photos/')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isPrivatePhoto) { setObjectUrl(null); return }
    let active = true
    let url: string | null = null
    void apiClient.get<Blob>(src, { responseType: 'blob' }).then((response) => {
      url = URL.createObjectURL(response.data)
      if (active) setObjectUrl(url)
      else URL.revokeObjectURL(url)
    }).catch(() => { if (active) setObjectUrl(null) })
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [isPrivatePhoto, src])

  return <img src={isPrivatePhoto ? objectUrl ?? undefined : src} alt={alt} loading="lazy" decoding="async" className={className} />
}
