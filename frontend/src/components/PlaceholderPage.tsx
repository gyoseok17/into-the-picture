import { EmptyState } from '@/components/state/EmptyState'

interface PlaceholderPageProps {
  title: string
  description?: string
}

// 미구현 탭(검색·혼잡도·비교·마이)의 자리표시 화면. 후속 마일스톤에서 실제 feature로 교체.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <EmptyState
        title="준비 중인 기능이에요"
        description={description ?? '곧 만나보실 수 있어요.'}
      />
    </section>
  )
}
