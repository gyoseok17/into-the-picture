import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AspectImage } from '@/components/AspectImage'
import { Badge } from '@/components/ui/badge'
import { CrowdCalendar, CrowdUnavailableNotice } from '@/features/contest/components/CrowdCalendar'
import { PhotoAlbumGrid, groupPhotoPage } from '@/features/photo-search/components/PhotoAlbums'
import { usePhotos } from '@/features/photo-search/hooks/usePhotos'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCrowdAttractions, useCrowdForecast, useCrowdRegions, useCrowdSigungu, useRelatedContests } from '../hooks/useCrowdDiscovery'

export default function CrowdPage() {
  const [areaCd, setAreaCd] = useState('')
  const [sigunguCd, setSigunguCd] = useState('')
  const [attraction, setAttraction] = useState('')
  const regions = useCrowdRegions()
  const sigungus = useCrowdSigungu(areaCd)
  const attractions = useCrowdAttractions(areaCd, sigunguCd)
  const forecast = useCrowdForecast(areaCd, sigunguCd, attraction)
  const relatedContests = useRelatedContests(attraction)
  const showPhotoSearch = Boolean(forecast.data)
  const photos = usePhotos(attraction, showPhotoSearch)
  const photoAlbums = useMemo(() => photos.data ? groupPhotoPage(photos.data.pages[0]?.content ?? []) : [], [photos.data])
  const hasNoAttractions = Boolean(sigunguCd && !attractions.isPending && !attractions.isError && attractions.data?.length === 0)

  useEffect(() => { setSigunguCd(''); setAttraction('') }, [areaCd])
  useEffect(() => { setAttraction('') }, [sigunguCd])

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">혼잡도</h1>
        <p className="text-sm text-muted-foreground">한국관광공사가 제공하는 관광지별 향후 30일 방문 집중률 예측값입니다. 가고 싶은 관광지를 골라 향후 30일 혼잡도를 확인하세요.</p>
      </header>

      {regions.isPending ? <LoadingState label="지역 목록 불러오는 중…" /> : regions.isError ? (
        <ErrorState error={regions.error} onRetry={() => void regions.refetch()} />
      ) : (
        <Card>
          <CardHeader><CardTitle>관광지 선택</CardTitle><CardDescription>지역부터 차례로 선택해 주세요.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Chooser label="시·도" value={areaCd} onChange={setAreaCd} placeholder="시·도 선택">
              {regions.data?.map((region) => <SelectItem key={region.areaCd} value={region.areaCd}>{region.areaNm}</SelectItem>)}
            </Chooser>
            <Chooser label="시·군·구" value={sigunguCd} onChange={setSigunguCd} placeholder="시·군·구 선택" disabled={!areaCd || sigungus.isPending}>
              {sigungus.data?.map((item) => <SelectItem key={item.sigunguCd} value={item.sigunguCd}>{item.sigunguNm}</SelectItem>)}
            </Chooser>
            <Chooser label="관광지" value={attraction} onChange={setAttraction} placeholder="관광지 선택" disabled={!sigunguCd || attractions.isPending}>
              {attractions.data?.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </Chooser>
          </CardContent>
        </Card>
      )}

      {hasNoAttractions ? (
        <CrowdUnavailableNotice />
      ) : null}

      {!attraction && !hasNoAttractions ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">관광지를 선택하면 날짜별 혼잡도를 보여드려요.</p> :
        forecast.isPending ? <LoadingState label="혼잡도 불러오는 중…" /> : forecast.isError ? <ErrorState error={forecast.error} onRetry={() => void forecast.refetch()} /> :
        forecast.data ? <><section className="space-y-2"><h2 className="font-semibold">{forecast.data.attractionName}</h2></section><RelatedContests contests={relatedContests.data ?? []} isPending={relatedContests.isPending} /><TourismPhotoResults isPending={photos.isPending} isError={photos.isError} error={photos.error} onRetry={() => void photos.refetch()} albums={photoAlbums} /><section className="space-y-2"><h2 className="font-semibold">향후 30일 집중률</h2><CrowdCalendar forecast={forecast.data} /></section></> :
        <CrowdUnavailableNotice />}
    </section>
  )
}

function TourismPhotoResults({ isPending, isError, error, onRetry, albums }: { isPending: boolean; isError: boolean; error: Error | null; onRetry: () => void; albums: import('@/features/photo-search/components/PhotoAlbums').PhotoAlbum[] }) {
  if (isPending) return <section className="space-y-3"><h2 className="font-semibold">키워드 검색 결과</h2><LoadingState label="관광사진을 불러오는 중…" /></section>
  if (isError) return <section className="space-y-3"><h2 className="font-semibold">키워드 검색 결과</h2><ErrorState error={error ?? new Error('관광사진을 불러오지 못했습니다.')} onRetry={onRetry} /></section>
  if (!albums.length) return <section className="space-y-3"><h2 className="font-semibold">키워드 검색 결과</h2><p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">이 관광지와 관련된 관광사진을 찾지 못했어요.</p></section>
  return <section className="space-y-3"><div><h2 className="font-semibold">키워드 검색 결과</h2><p className="text-sm text-muted-foreground">관광지명으로 찾은 관광사진이에요. 같은 이름의 다른 지역 사진이 함께 나올 수 있어 촬영지 정보를 확인해 주세요.</p></div><PhotoAlbumGrid albums={albums} /></section>
}

function RelatedContests({ contests, isPending }: { contests: import('@/features/contest/types').ContestSummary[]; isPending: boolean }) {
  if (isPending) return <section className="space-y-3"><h2 className="font-semibold">이곳을 담은 수상작</h2><LoadingState label="관련 수상작을 찾는 중…" /></section>
  if (!contests.length) return <section className="space-y-3"><h2 className="font-semibold">이곳을 담은 수상작</h2><p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">이 관광지와 관련된 수상작을 찾지 못했어요.</p></section>
  return <section className="space-y-3"><div><h2 className="font-semibold">이곳을 담은 수상작</h2><p className="text-sm text-muted-foreground">선택한 관광지와 관련된 수상작이에요.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{contests.map((contest) => <Link key={contest.id} to={`/contests/${contest.id}`} className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50"><AspectImage src={contest.thumbUrl} alt={contest.title} ratioClassName="aspect-[4/3]" /><div className="space-y-1 p-3"><Badge variant="secondary">{contest.awardGrade}</Badge><h3 className="line-clamp-2 font-medium">{contest.title}</h3><p className="line-clamp-1 text-xs text-muted-foreground">{contest.location}</p></div></Link>)}</div></section>
}

function Chooser({ label, value, onChange, placeholder, disabled, children }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{children}</SelectContent></Select></label>
}
