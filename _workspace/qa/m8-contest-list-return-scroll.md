# M8 수상작 상세 → 목록 복귀 스크롤 QA

- 검토일: 2026-08-18
- 범위: PC에서 수상작 상세의 `수상작 목록` 버튼을 눌렀을 때 기존 목록 위치로 복귀하지 않는 문제
- 코드 변경: 없음

## 원인

기존 흐름은 목록 카드가 단순히 `/contests/:id`로 이동하고, 상세의 `수상작 목록`도 `/contests`로 새 이동을 만들었다. 따라서 이전 목록의 무한 스크롤 페이지, 적용 필터, 문서 스크롤 위치를 가진 history entry를 사용하지 못하고 새 목록이 최상단에서 마운트됐다. 화면 폭 자체가 원인이 아니라 PC에서 긴 그리드를 더 멀리 내리는 사용 패턴에서 문제를 더 쉽게 드러낸 것이다.

## 현재 변경의 상태 계약

원래 `/contests` history entry의 `window.history.state.usr`에 아래 상태를 보존한다.

```ts
{
  contestListRestore: {
    locationKey: location.key,
    query: ContestQuery,
    scrollY: number,
  }
}
```

- `ContestCard`는 상세 이동 시 `state: { contestListEntry: true }`를 남기고, 이동 직전에 위 값을 원래 목록 entry에 `replaceState`한다.
- `ContestDetailPage`는 이 진입 표식이 있을 때만 `navigate(-1)`로 같은 목록 history entry를 다시 사용한다.
- `ContestListPage`는 `location.state.contestListRestore`를 읽어 query를 초기화하고, 첫 목록 렌더 이후 `requestAnimationFrame`에서 `scrollY`를 복구한다.
- 직접 URL 진입, 홈·지도·즐겨찾기 등의 다른 진입 경로에는 표식이 없으므로 `/contests` 최상단으로 가는 안전한 fallback을 유지한다.

## 코드 검토 판정

**원인 해결 방향은 적합하다.** 원래 history entry를 복귀 대상으로 삼으므로 필터와 React Query의 이미 로드된 무한 목록 캐시를 재사용할 수 있다. `locationKey` 검증은 다른 history entry의 오래된 상태를 잘못 적용하는 것을 막는다.

다만 실제 브라우저에서 다음을 확인하기 전에는 최종 통과로 판정하지 않는다.

1. 브라우저의 native scroll restoration과 React의 `requestAnimationFrame` 복구가 충돌하지 않는지
2. 이미지가 늦게 로드되어 복귀 직후 레이아웃 높이가 달라지는지
3. 2페이지 이상 로드된 목록에서 복귀 지점의 카드가 여전히 DOM에 남아 있는지

## 재현 및 회귀 테스트

| 상황 | 기대 결과 |
| --- | --- |
| PC 1280px, 기본 목록에서 3페이지 이상 내린 뒤 카드 선택 → 상세 `수상작 목록` | 같은 카드 부근으로 복귀한다. 최상단으로 가지 않는다. |
| PC에서 계절·등급·지역·키워드를 적용하고 충분히 내린 뒤 동일 흐름 | 적용한 `ContestQuery`, 목록, 스크롤 위치가 모두 유지된다. |
| 모바일 360px, 1/2/3열 각각에서 동일 흐름 | 선택한 열 설정과 목록 위치가 유지되고, 하단 탭·floating 도구와 겹치지 않는다. |
| 상세 화면에서 브라우저 뒤로 가기 | 동일한 목록 history entry와 위치로 복귀한다. |
| 홈·지도 선택 패널·즐겨찾기에서 상세 진입 후 `수상작 목록` | 이전 화면이 아니라 `/contests`의 안전한 최상단 목록으로 이동한다. |
| 상세 URL을 새 탭/주소창에서 직접 열기 | `navigate(-1)`을 시도하지 않고 `/contests`로 fallback 한다. |
| 뒤로 복귀한 목록에서 다른 카드 선택 후 다시 복귀 | 새로 저장한 위치로 복귀하며, 이전 `scrollY`가 재적용되지 않는다. |

## 권고

- 자동 테스트를 추가한다면 `ContestDetailPage`의 진입 표식 유무에 따른 `navigate(-1)` / `navigate('/contests')` 분기와, restore state의 `locationKey` 불일치 거부를 단위 테스트로 고정한다.
- E2E에서는 위 첫 두 흐름을 실제 viewport에서 검증한다. 스크롤 값 정확한 일치보다, 선택했던 카드가 viewport 안에 존재하는지를 기준으로 하면 이미지 로드 지연에도 견고하다.
