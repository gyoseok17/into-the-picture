import { ArrowUpRight, CalendarDays, Compass, Images } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { AspectImage } from '@/components/AspectImage'
import { useAuth } from '@/features/auth/AuthProvider'
import { useContestDetail } from '@/features/contest/hooks/useContestDetail'
import { useContests } from '@/features/contest/hooks/useContests'
import type { ContestSummary } from '@/features/contest/types'
import { EditorialSection } from '@/features/home/components/EditorialSection'
import { HomeFeatureIndex } from '@/features/home/components/HomeFeatureIndex'
import { useHomeLeadContests } from '@/features/home/hooks/useHomeLeadContests'

const searchKeywords = ['바다', '숲', '봄꽃', '야경', '산책']

/** 사진을 먼저 보고 다음 여행을 고르는, 홈 전용 에디토리얼 진입 화면. */
export default function HomePage() {
  const { user } = useAuth()
  const featuredQuery = useContests({})
  const homeLeadContestsQuery = useHomeLeadContests()
  const featuredContests = useMemo(
    () => featuredQuery.data?.pages[0]?.content.slice(0, 6) ?? [],
    [featuredQuery.data],
  )
  const leadContest = useMemo(
    () => homeLeadContestsQuery.data
      ? selectMonthlyLeadContest(homeLeadContestsQuery.data)
      : featuredContests[0],
    [featuredContests, homeLeadContestsQuery.data],
  )
  const leadContestDetailQuery = useContestDetail(homeLeadContestsQuery.data ? (leadContest?.id ?? 0) : 0)

  return (
    <div className="relative overflow-hidden bg-[#e4f1ec] pb-12 sm:pb-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[30rem] h-[42rem] bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.72),transparent_34%),radial-gradient(circle_at_92%_32%,rgba(183,217,204,0.5),transparent_30%)]" />
      <section className="relative grid overflow-hidden bg-[#d4e8df] md:min-h-[35rem] md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 order-1 flex flex-col justify-between px-5 pb-7 pt-12 sm:px-8 sm:pb-10 md:min-h-[35rem] md:px-1 md:py-14 md:pr-12">
          <div className="max-w-lg space-y-5">
            <p className="text-xs font-medium tracking-[0.22em] text-primary/70">INTO THE PICTURE · KOREA</p>
            <h1 className="font-editorial text-5xl leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
              사진으로<br />떠나는 여행
            </h1>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
              낯선 풍경 한 장에서 시작하는 여행. 오늘은 어느 장면으로 떠나볼까요?
            </p>
          </div>
        </div>

        <div className="relative order-2 mx-5 mb-5 min-h-[50svh] overflow-hidden rounded-[1.5rem] bg-secondary shadow-[0_1.25rem_3.5rem_rgba(48,91,79,0.16)] sm:mx-8 sm:mb-8 md:mx-0 md:mb-0 md:min-h-full md:rounded-none md:shadow-none">
          {leadContest ? (
            <>
              <AspectImage src={leadContestDetailQuery.data?.imageUrl ?? leadContest.thumbUrl} alt={leadContest.title} ratioClassName="absolute inset-0" className="h-full" />
              <Link to={`/contests/${leadContest.id}`} className="absolute inset-x-3 bottom-3 rounded-xl bg-[#eff8f5]/95 px-4 py-3 text-foreground shadow-sm backdrop-blur-sm sm:inset-x-4 sm:bottom-4 md:inset-x-0 md:bottom-0 md:rounded-none md:bg-gradient-to-t md:from-black/70 md:via-black/20 md:to-transparent md:px-6 md:pb-7 md:pt-24 md:text-white md:shadow-none md:backdrop-blur-none">
                <p className="text-xs tracking-wide text-muted-foreground md:text-white/70">오늘의 여행 장면 · {leadContest.location}</p>
                <p className="mt-1 flex items-center gap-1 text-base font-medium md:text-lg">{leadContest.title}<ArrowUpRight className="h-4 w-4" /></p>
              </Link>
            </>
          ) : <div className="h-full bg-gradient-to-br from-[#dff4ed] via-[#d5ebe4] to-[#b8d8cf]" />}
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl space-y-8 px-5 pt-8 sm:space-y-12 sm:px-8 sm:pt-12 lg:space-y-16 lg:px-0 lg:pt-16">
        <HomeFeatureIndex isSignedIn={Boolean(user)} />

        <EditorialSection
          id="recommended"
          className="rounded-[1.75rem] bg-[#f4faf7]/90 px-5 py-8 shadow-[0_1.25rem_3rem_rgba(55,93,82,0.08)] sm:rounded-[2.25rem] sm:px-8 sm:py-11 lg:px-10"
          eyebrow="SCENES FOR A NEXT TRIP"
          title="추천 여행지"
          description="전국 관광 사진 공모전 수상작으로, 마음이 가는 여행지를 천천히 골라보세요."
          action={<Link to="/contests" className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">수상작 전체 보기 <ArrowUpRight className="h-4 w-4" /></Link>}
        >
          {featuredQuery.isPending ? <FilmLoading /> : null}
          {featuredContests.length > 0 ? <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:gap-6 sm:px-8 lg:mx-0 lg:px-0">
            {featuredContests.map((contest, index) => (
              <Link key={contest.id} to={`/contests/${contest.id}`} className="group w-[11.5rem] shrink-0 snap-start sm:w-[15rem]">
                <div className={index % 3 === 1 ? 'pt-9 sm:pt-14' : index % 3 === 2 ? 'pt-3 sm:pt-6' : ''}>
                  <AspectImage src={contest.thumbUrl} alt={contest.title} ratioClassName="aspect-[3/4]" className="transition duration-500 group-hover:scale-[1.015]" />
                  <p className="mt-3 text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')} · {contest.location}</p>
                  <p className="mt-1 line-clamp-1 text-sm font-medium">{contest.title}</p>
                </div>
              </Link>
            ))}
          </div> : null}
        </EditorialSection>

        <section className="relative grid overflow-hidden rounded-[1.75rem] bg-[#cce3d9] px-5 py-9 shadow-[0_1.25rem_3rem_rgba(55,93,82,0.07)] sm:grid-cols-[0.9fr_1.1fr] sm:rounded-[2.25rem] sm:px-8 sm:py-12 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full border-[1.25rem] border-white/25" />
          <div className="relative space-y-3">
            <p className="text-xs font-medium tracking-[0.18em] text-primary/70">WHEN TO GO</p>
            <h2 className="font-editorial text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">사람이 적은 날,<br />더 오래 머무는 여행</h2>
          </div>
          <div className="relative flex flex-col justify-between gap-7 sm:py-1">
            <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">한국관광공사가 제공하는 관광지별 향후 30일 방문 집중률을 보고, 마음에 둔 여행지의 한가로운 날을 찾아보세요.</p>
            <Link to="/crowd" className="group flex items-center justify-between rounded-xl bg-white/45 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/70">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> 여행지 혼잡도 살펴보기</span><ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <section className="grid gap-8 rounded-[1.75rem] bg-[#edf7f2] px-5 py-9 sm:grid-cols-[1.2fr_0.8fr] sm:items-end sm:rounded-[2.25rem] sm:px-8 sm:py-12 lg:px-10">
          <div className="space-y-5">
            <p className="text-xs font-medium tracking-[0.18em] text-primary/70">FIND A SCENE</p>
            <h2 className="font-editorial text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">어디로 떠나고 싶나요?</h2>
            <div className="flex flex-wrap gap-2">
              {searchKeywords.map((keyword) => <Link key={keyword} to={`/explore?keyword=${encodeURIComponent(keyword)}`} className="rounded-full border border-[#b8d6ca] bg-white/65 px-4 py-2 text-sm transition-colors hover:border-primary hover:bg-white">{keyword}</Link>)}
            </div>
          </div>
          <Link to="/explore" className="group flex items-center justify-between rounded-2xl bg-[#b8d8cb] px-5 py-5 text-sm font-medium text-foreground shadow-[0_0.75rem_1.75rem_rgba(55,93,82,0.12)] transition-colors hover:bg-[#afd1c3] sm:px-6">
            <span className="flex items-center gap-2"><Compass className="h-4 w-4" /> 키워드로 여행지 찾기</span><ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </section>

        {user ? <section className="flex flex-col gap-4 rounded-[1.75rem] bg-[#d9ebe4] px-5 py-8 sm:flex-row sm:items-end sm:justify-between sm:rounded-[2.25rem] sm:px-8 sm:py-10 lg:px-10">
          <div><p className="text-xs font-medium tracking-[0.18em] text-primary/70">MY SCENES</p><h2 className="mt-2 font-editorial text-2xl tracking-[-0.035em]">내가 남긴 장면</h2><p className="mt-1 text-sm text-muted-foreground">수상작과 나란히 놓아 본 나의 사진을 다시 꺼내보세요.</p></div>
          <Link to="/compare" className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">내 사진 보기 <Images className="h-4 w-4" /></Link>
        </section> : null}
      </div>
    </div>
  )
}

function selectMonthlyLeadContest(contests: ContestSummary[]): ContestSummary | undefined {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const monthlyContests = contests.filter((contest) => /^\d{6}$/.test(contest.filmMonth) && contest.filmMonth.endsWith(currentMonth))
  const candidates = monthlyContests.length > 0 ? monthlyContests : contests

  if (candidates.length === 0) return undefined

  const storageKey = `into-the-picture:home-lead:${currentMonth}`
  const savedId = readSessionValue(storageKey)
  const savedContest = candidates.find((contest) => String(contest.id) === savedId)
  if (savedContest) return savedContest

  const selectedContest = candidates[Math.floor(Math.random() * candidates.length)]
  writeSessionValue(storageKey, String(selectedContest.id))
  return selectedContest
}

function readSessionValue(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value)
  } catch {
    // 세션 저장소를 사용할 수 없으면 현재 렌더링의 선택값만 사용한다.
  }
}

function FilmLoading() {
  return <div className="-mx-4 flex gap-4 overflow-hidden px-4 sm:-mx-8 sm:gap-6 sm:px-8 lg:mx-0 lg:px-0">{Array.from({ length: 4 }).map((_, index) => <div key={index} className={`w-[11.5rem] shrink-0 animate-pulse bg-muted sm:w-[15rem] ${index % 3 === 1 ? 'mt-9 sm:mt-14' : index % 3 === 2 ? 'mt-3 sm:mt-6' : ''}`}><div className="aspect-[3/4]" /><div className="mt-3 h-3 w-2/3 rounded bg-muted-foreground/10" /></div>)}</div>
}
