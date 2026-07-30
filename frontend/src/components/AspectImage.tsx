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
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'h-full w-full',
          fit === 'cover' ? 'object-cover' : 'object-contain',
        )}
      />
    </div>
  )
}
