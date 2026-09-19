import { ArrowLeft, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ComparisonVisibilityManager } from '../components/ComparisonVisibilityManager'
import { useComparisons } from '../hooks/useComparison'

/** A focused My-page subpage for changing comparison sharing without opening each result. */
export default function ComparisonManagementPage() {
  const comparisons = useComparisons()

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/me">
            <ArrowLeft aria-hidden />
            마이로
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Eye className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">비교 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              수상작과 비교한 사진을 다른 사람에게 보여줄지 한눈에 관리하세요.
            </p>
          </div>
        </div>
      </header>

      <ComparisonVisibilityManager
        comparisons={comparisons.data ?? []}
        isLoading={comparisons.isPending}
        error={comparisons.isError ? comparisons.error : null}
        onRetry={() => void comparisons.refetch()}
      />
    </section>
  )
}
