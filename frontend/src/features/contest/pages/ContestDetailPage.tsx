import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Images } from "lucide-react";

import { AspectImage } from "@/components/AspectImage";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { ContestComparisonEntry } from "@/features/comparison/components/ContestComparisonEntry";
import { PhotoComparisonResultDialog } from "@/features/comparison/components/PhotoComparisonResultDialog";
import {
  useComparisons,
  usePublicContestComparisons,
} from "@/features/comparison/hooks/useComparison";
import { FavoriteSaveErrorNotice } from "@/features/favorite/components/FavoriteSaveErrorNotice";
import { LoginRequiredDialog } from "@/features/favorite/components/LoginRequiredDialog";
import {
  useContestFavoriteStatus,
  useToggleContestFavorite,
} from "@/features/favorite/hooks/useFavorites";
import { formatFilmMonth } from "@/lib/format";
import { ContestDetailOverlay } from "../components/ContestDetailOverlay";
import { ContestMap } from "../components/ContestMap";
import {
  CrowdCalendar,
  CrowdUnavailableNotice,
} from "../components/CrowdCalendar";
import { PublicComparisonDialog } from "../components/PublicComparisonDialog";
import { useContestCrowd } from "../hooks/useContestCrowd";
import { useContestDetail } from "../hooks/useContestDetail";
import type { CrowdForecast } from "../types";

/** Route-level coordination only; detail chrome and modal flows live in dedicated components. */
export default function ContestDetailPage() {
  const { id: idParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const id = Number(idParam);
  const isValidId = Number.isInteger(id) && id > 0;
  const detailQuery = useContestDetail(id);
  const detail = detailQuery.data;
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPublicComparisons, setShowPublicComparisons] = useState(false);
  const [showSavedComparison, setShowSavedComparison] = useState(false);
  const savedComparisonTriggerRef = useRef<HTMLButtonElement>(null);
  const favoriteStatus = useContestFavoriteStatus(
    id,
    Boolean(user && isValidId),
  );
  const toggleFavorite = useToggleContestFavorite(id);
  const comparisons = useComparisons(Boolean(user && isValidId));
  const contestComparisons =
    comparisons.data?.filter((comparison) => comparison.contest.id === id) ??
    [];
  const existingComparison = contestComparisons[0];
  const publicComparisons = usePublicContestComparisons(
    id,
    isValidId && showPublicComparisons,
  );
  const openedFromContestList = location.state?.contestListEntry === true;
  const crowdQuery = useContestCrowd(id, detail?.crowdAvailable ?? false);

  const handleListReturn = useCallback(() => {
    if (openedFromContestList) navigate(-1);
    else navigate("/contests");
  }, [navigate, openedFromContestList]);
  const handleFavorite = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (detail)
      toggleFavorite.mutate({
        favorite: favoriteStatus.data?.favorite ?? false,
        contest: detail,
      });
  };

  return (
    <ContestDetailOverlay
      overlay={openedFromContestList}
      onClose={handleListReturn}
      suspendEscape={showPublicComparisons || showSavedComparison}
    >
      <article className="space-y-5">
        <button
          type="button"
          onClick={handleListReturn}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          수상작 목록
        </button>
        {!isValidId ? (
          <ErrorState
            error={{ code: "BAD_REQUEST", message: "잘못된 주소예요." }}
          />
        ) : detailQuery.isPending ? (
          <DetailSkeleton />
        ) : detailQuery.isError ? (
          <ErrorState
            error={detailQuery.error}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : detail ? (
          <ContestDetailContent
            detail={detail}
            favorite={favoriteStatus.data?.favorite ?? false}
            favoritePending={
              toggleFavorite.isPending ||
              Boolean(user && favoriteStatus.isPending)
            }
            onFavorite={handleFavorite}
            hasUser={Boolean(user)}
            existingComparison={existingComparison}
            comparisonTriggerRef={savedComparisonTriggerRef}
            onOpenComparison={() => setShowSavedComparison(true)}
            onOpenPublicComparisons={() => setShowPublicComparisons(true)}
            crowdQuery={crowdQuery}
          />
        ) : null}
        <LoginRequiredDialog
          open={showLoginPrompt}
          returnTo={`/contests/${id}`}
          onClose={() => setShowLoginPrompt(false)}
        />
        <FavoriteSaveErrorNotice
          open={toggleFavorite.isError}
          onClose={() => toggleFavorite.reset()}
        />
        {showPublicComparisons ? (
          <PublicComparisonDialog
            comparisons={publicComparisons.data ?? []}
            isLoading={
              publicComparisons.isPending ||
              Boolean(user && comparisons.isPending)
            }
            error={publicComparisons.isError ? publicComparisons.error : null}
            onRetry={() => void publicComparisons.refetch()}
            onClose={() => setShowPublicComparisons(false)}
            contestImageUrl={detail?.imageUrl ?? ""}
            contestTitle={detail?.title ?? "수상작 원본"}
          />
        ) : null}
        {showSavedComparison && existingComparison ? (
          <PhotoComparisonResultDialog
            comparisons={contestComparisons}
            initialComparisonId={existingComparison.id}
            returnFocusRef={savedComparisonTriggerRef}
            onClose={() => setShowSavedComparison(false)}
          />
        ) : null}
      </article>
    </ContestDetailOverlay>
  );
}

function ContestDetailContent({
  detail,
  favorite,
  favoritePending,
  onFavorite,
  hasUser,
  existingComparison,
  comparisonTriggerRef,
  onOpenComparison,
  onOpenPublicComparisons,
  crowdQuery,
}: {
  detail: NonNullable<ReturnType<typeof useContestDetail>["data"]>;
  favorite: boolean;
  favoritePending: boolean;
  onFavorite: () => void;
  hasUser: boolean;
  existingComparison: ReturnType<typeof useComparisons>["data"] extends
    (infer Item)[] | undefined
    ? Item | undefined
    : never;
  comparisonTriggerRef: RefObject<HTMLButtonElement>;
  onOpenComparison: () => void;
  onOpenPublicComparisons: () => void;
  crowdQuery: ReturnType<typeof useContestCrowd>;
}) {
  return (
    <>
      <div className="relative md:float-left md:mr-8 md:w-[42%] md:max-w-[34rem] lg:mr-10">
        <AspectImage
          src={detail.imageUrl}
          alt={detail.title}
          fit="contain"
          ratioClassName="aspect-[4/3] md:aspect-[5/4]"
          className="rounded-lg border bg-muted/40"
        />
        {favorite && existingComparison ? (
          <div className="absolute bottom-3 right-3">
            <ContestComparisonEntry
              comparison={existingComparison}
              onOpen={onOpenComparison}
              triggerRef={comparisonTriggerRef}
            />
          </div>
        ) : null}
      </div>
      <header className="space-y-2 md:pt-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {detail.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={favoritePending}
              onClick={onFavorite}
              className="h-9 w-9 shrink-0"
              title={hasUser ? undefined : "로그인이 필요한 기능이에요"}
            >
              <Heart
                className={`h-4 w-4 ${favorite ? "fill-current text-rose-500" : ""}`}
                aria-hidden
              />
              <span className="sr-only">{favorite ? "저장 해제" : "저장"}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="수상작과 비교한 사진 보기"
              onClick={onOpenPublicComparisons}
            >
              <Images className="h-4 w-4" aria-hidden />
            </Button>
            {favorite && !existingComparison ? (
              <Button asChild size="sm" className="shrink-0">
                <Link to={`/me/album?contestId=${detail.id}`}>수상작 비교</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{detail.awardGrade}</Badge>
          <Badge variant="outline">{detail.awardDivision}</Badge>
          {detail.season ? (
            <Badge variant="outline">{detail.season}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {detail.photographer} · {formatFilmMonth(detail.filmMonth)}
        </p>
        <p className="text-sm text-muted-foreground">{detail.location}</p>
      </header>
      {detail.keywords.length ? (
        <div className="flex flex-wrap gap-1">
          {detail.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline" className="font-normal">
              #{keyword}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="clear-both space-y-8 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] md:gap-0 md:space-y-0 md:overflow-hidden md:rounded-2xl md:border md:bg-muted/20">
        <div className="min-w-0 md:p-6">
          <Section title="위치">
            <ContestMap
              kakaoPlaceId={detail.kakaoPlaceId}
              lat={detail.lat}
              lng={detail.lng}
            />
          </Section>
        </div>
        <div className="min-w-0 md:border-l md:p-6">
          <CrowdSection
            isLoading={crowdQuery.isPending}
            isError={crowdQuery.isError}
            forecast={crowdQuery.data ?? null}
            onRetry={() => void crowdQuery.refetch()}
          />
        </div>
      </div>
    </>
  );
}

function CrowdSection({
  isLoading,
  isError,
  forecast,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  forecast: CrowdForecast | null;
  onRetry: () => void;
}) {
  if (isLoading)
    return (
      <Section title="방문 타이밍">
        <LoadingState label="집중률을 불러오는 중이에요." />
      </Section>
    );
  if (isError)
    return (
      <Section title="방문 타이밍">
        <ErrorState onRetry={onRetry} />
      </Section>
    );
  if (!forecast)
    return (
      <Section title="방문 타이밍">
        <CrowdUnavailableNotice />
      </Section>
    );
  return (
    <Section title="방문 타이밍" subtitle={forecast.attractionName}>
      <CrowdCalendar forecast={forecast} />
    </Section>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="aspect-[16/10] w-full rounded-lg" />
    </div>
  );
}
