# M10 일관성 경계 정리 QA

## 사전 검토 — 2026-09-20

### 계약 대조 대상

| 경계 | 생산자·소비자 | 현재 확인 | 회귀 위험 / 최종 판정 기준 |
| --- | --- | --- | --- |
| 사진 지역 입력 | `UserPhotoUploadService`, `PhotoRecordBundleService`, `UserPhotoService` → `PhotoRecord` | 세 경로 모두 `MapLocationCatalog.resolve`를 호출하지만 trim·길이 제한 로직이 각 서비스에 중복되어 있다. 묶음은 상위에서 검증한 값을 사진별 저장 시 다시 검증한다. | 단건 업로드, 묶음 업로드, 수정 모두 하나의 정규화·검증 경계로 수렴해야 한다. `null`, 공백, 길이 초과, 지역-도시 불일치의 오류 의미가 같아야 한다. |
| 앨범 캐시 | `photoRecordQueryKeys` + `usePhotoRecords` mutations | 새 모듈은 records/bundles/map/bundleMap을 한곳에서 관리하며, 앨범 변경 뒤 비교 캐시도 함께 갱신한다. | 직접 배열 키가 훅에 남지 않아야 한다. 사진 변경·삭제·묶음 변경이 모든 앨범 투영을 무효화해야 한다. 대표 설정은 bundle map만 갱신해도 되는지 확인한다. |
| 비교 캐시 | `comparisonQueryKeys` + `useComparison` mutations | 전체 비교 목록과 수상작별 공개 목록에 접두 키가 있다. 앨범 변경은 비교 목록도 갱신한다. | 생성·삭제·교체·크롭·공개 설정 모두 개인/공개 조회를 갱신해야 한다. 특히 공개 설정 변경 뒤 수상작 상세 공개 목록이 즉시 최신이어야 한다. |
| 모달 상호작용 | 수상작 상세 오버레이·공개 비교 다이얼로그·사진 확대·편집·장소 선택 | 수상작 상세/공개 비교에는 Esc·포커스 복귀·스크롤 잠금 구현이 이미 있으나, 사진 확대·편집·장소 선택에는 동작이 분산돼 있다. | 실제로 동일한 Esc/포커스/스크롤 잠금 동작만 공통 훅으로 이동해야 한다. 업로드 중 Esc 차단, 중첩 모달의 바깥 모달 Esc 차단, 닫은 뒤 트리거 포커스 복귀는 유지해야 한다. |

### 범위 보호

- API URL·DTO·DB 마이그레이션과 화면 디자인은 변경 대상이 아니다.
- 모든 모달을 하나로 합치는 리팩터링은 금지한다. 접근성 동작이 같은 경우에만 공통 훅을 사용한다.
- 기존 전체 앱에는 다른 도메인의 직접 query key 배열이 남아 있다. 이번 계약의 실제 변경 대상과 무관한 광범위 변환은 회귀 위험이 있으므로, 새로 정리하는 photo-record·comparison 도메인부터 직접 배열을 제거했는지 우선 확인한다.

### 최종 검증 계획

1. 백엔드 테스트 및 프런트 빌드 실행
2. 세 사진 지역 입력 경로의 `MapLocationCatalog` 호출 지점과 예외 형식 교차 대조
3. `photo-record`, `comparison` hooks/API에서 직접 배열 query key·누락된 무효화 검색
4. 공통 모달 훅 소비처에서 Esc, 바깥 클릭, 포커스 복귀, body scroll lock 중첩 회귀 확인
5. `git diff --check` 및 계약 비범위(API/DTO/DB) 변경 여부 확인

## 변경 후 교차 검증 — 2026-09-22

### 지역 입력 경계

- `MapLocationInputResolver`가 공백→`null`, 길이 제한(권역 32자·도시 48자)을 한 번 처리한 뒤 `MapLocationCatalog.resolve`에 위임한다.
- 단건 업로드(`UserPhotoUploadService`), 묶음 업로드(`PhotoRecordBundleService`), 수정(`UserPhotoService`)의 쓰기 경로가 모두 이 resolver만 사용함을 대조했다.
- 빈 선택, 공백/대소문자 정규화, 길이 초과는 resolver 단위 테스트로 확인했다. 지역 없는 도시·권역-도시 불일치는 기존 catalog의 `INVALID_REQUEST` 검증을 그대로 사용한다.
- API URL·DTO·DB 스키마에는 이 경계 정리로 인한 변경이 없다.

### 캐시 키·무효화

- `rg 'queryKey\\s*:\\s*\\[' frontend/src --glob '!**/queryKeys.ts'` 결과 직접 배열 query key는 0건이다.
- album projection 무효화는 records/bundles/map/bundleMap을 함께 갱신한다.
- 비교 생성·삭제·사진 교체는 비교와 앨범 projection을 함께 갱신한다. QA에서 발견한 생성 후 앨범 무효화 누락은 수정됐다.
- 비교 공개 설정·크롭은 비교 조회만 바꾸므로 comparison key만 무효화하는 현재 범위가 적절하다. 대표 사진 설정은 bundle map 투영만 바꾼다.

### 모달 공통 동작

- 단순 Esc 닫기는 `useEscapeDismiss`로 이동했다.
- 수상작 상세·공개 비교 창은 중첩 안전한 body overflow 잠금과 포커스 복귀 훅을 사용한다.
- 수상작 상세의 Tab focus trap, 비교 결과의 단계별 Esc 복귀는 화면 고유 동작이므로 직접 리스너로 남겼으며 계약의 공통화 비범위에 부합한다.
- `PhotoAddSheet`의 업로드 중 Esc 차단과 장소 선택기의 disabled 처리도 공통 훅 옵션으로 유지된다.

### 실행 검증·판정

- `backend\\gradlew.bat test --no-daemon` 통과.
- 프런트 `npm run build` 통과. 기존 초기 청크 약 820KB 경고만 있으며 이번 변경의 기능 차단 이슈는 아니다.
- `git diff --check` 통과. 직접 keydown 검색 결과는 비교 결과의 단계별 Esc와 전역 메뉴/보조 UI만 남아 있어, 이번 공통화 대상의 누락이 아니다.

**통합 판정: 통과.** API·DB·화면 구조를 바꾸지 않고 지역 입력, 캐시 키, 공통 모달 동작의 중복 경계를 정리했다. 권고: 실제 브라우저에서 중첩 상세→공개 비교, 사진 추가→장소 선택, 비교 결과→크롭 편집의 Esc·포커스 복귀를 한 번씩 수동 확인한다.
