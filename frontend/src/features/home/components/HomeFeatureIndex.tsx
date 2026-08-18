import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type HomeFeatureIndexProps = {
  isSignedIn: boolean
}

const features = [
  {
    number: '01',
    title: '추천 여행지',
    description: '공모전 수상작을 지도와 함께 둘러봐요.',
    to: '/contests',
  },
  {
    number: '02',
    title: '사진 찾기',
    description: '키워드로 여행 장면을 찾아요.',
    to: '/explore',
  },
  {
    number: '03',
    title: '혼잡도 보기',
    description: '앞으로 30일의 방문 집중률을 확인해요.',
    to: '/crowd',
  },
  {
    number: '04',
    title: '내 사진 남기기',
    description: '내 사진을 수상작과 함께 기록해요.',
    to: '/compare',
  },
] as const

/** 홈에서 주요 기능의 진입점을 한눈에 보여주는 독립 인덱스. */
export function HomeFeatureIndex({ isSignedIn }: HomeFeatureIndexProps) {
  return (
    <section aria-labelledby="home-feature-index-title" className="border-y border-[#9dbbb0]/65 py-5 sm:py-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="home-feature-index-title" className="text-xs font-medium tracking-[0.18em] text-primary/70">
          EXPLORE THE PICTURE
        </h2>
        <p className="text-xs text-muted-foreground">사진으로 여행을 시작하세요</p>
      </div>

      <div className="divide-y divide-[#9dbbb0]/65 sm:grid sm:grid-cols-4 sm:divide-y-0">
        {features.map((feature, index) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="group block min-h-[8.5rem] py-5 transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:min-h-[10.5rem] sm:border-l sm:border-[#9dbbb0]/65 sm:px-5 sm:py-0 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
          >
            <p className="text-xs tabular-nums text-primary/65">{feature.number}</p>
            <div className="mt-4 flex items-center justify-between gap-3 sm:mt-8">
              <p className="text-base font-medium tracking-[-0.02em]">{feature.title}</p>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-primary/70 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{feature.description}</p>
            {index === 3 && !isSignedIn ? <p className="mt-3 text-xs text-primary/70">로그인 후 이용</p> : null}
          </Link>
        ))}
      </div>
    </section>
  )
}
