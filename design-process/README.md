# design-process — 설계 검증 과정 기록

> 설계 결정을 **어떻게 검증했는지**의 기록(증거) + 재현용 스크립트.
> 외부 API 실제 응답 확인, 시군구 코드 변환, 카카오 지오코딩 검증 등.
> **실제 앱 코드가 아니다.** 빌드(하네스/앱)에는 불필요하며, 과정 보관·재현 목적.

## 준비물

- **Python 3.8+** (추가 패키지 설치 불필요 — 표준 라이브러리만 사용)
- 프로젝트 루트의 **`.env`** 에 키가 있어야 함 (git 제외):
  ```
  DATA_GO_KR_KEY=<공공데이터포털 인증키>
  KAKAO_REST_KEY=<카카오 REST API 키>
  ```

## 실행 방법 (프로젝트 루트에서)

```bash
python design-process/call_tour_apis.py        # 공모전/관광사진/집중률 3개 API 샘플 응답
python design-process/parse_sigungu.py         # 시군구 코드 엑셀 → data/sigungu-codes.json + 요약
python design-process/geocode_works.py 8       # 수상작 8건 촬영지 → 카카오 좌표 변환 (성공률)
python design-process/crowd_list.py 48 48890   # 합천군 집중률 대상 관광지 목록 (areaCd sigunguCd)
```
> `python` 이 안 되면 `py design-process/...` 로 시도. 한글 출력이 깨지면 스크립트가 UTF-8로 강제하지만, 콘솔이 cp949면 `chcp 65001` 후 실행.

## 파일

| 파일 | 설명 |
|------|------|
| `_common.py` | 키 로딩(.env) + HTTP 공통 유틸 |
| `call_tour_apis.py` | 한국관광공사 3개 API 실제 응답 출력 |
| `parse_sigungu.py` | 시군구 코드 엑셀 파싱 → JSON |
| `geocode_works.py` | 촬영지 텍스트 → 카카오 지오코딩 검증 |
| `crowd_list.py` | 시군구별 집중률 대상 관광지 조회 |
| `data/` | 원본 엑셀 + 생성된 `sigungu-codes.json` |

## 메모

- 실제 API 응답 스펙·결정사항은 설계 문서 `docs/06-external-apis.md` 에 정리돼 있음.
- `data/sigungu-codes.json` 은 실제 앱(집중률 기능)이 쓸 데이터 → **구축 후 앱 리소스로 이동 예정** (지금은 이 폴더에 보관).
