# 한국관광공사 API — 필드 매핑

전체 스펙·실측 응답은 `docs/06-external-apis.md`. 여기는 어댑터 구현용 매핑 요약.

공통: `serviceKey`(URL-encode), `MobileOS=ETC`, `MobileApp=IntoThePicture`, `_type=json`. 응답 래퍼 `response.body.items.item[]` + `totalCount`.

## 공모전 수상작 — PhokoAwrdService/phokoAwrdList (DB 저장)
| 외부 필드 | 내부(ContestWork/DTO) |
|-----------|----------------------|
| contentId | contentId |
| koTitle/enTitle | title/titleEn |
| koFilmst/enFilmst | location/locationEn |
| lDongRegnCd | sidoCode |
| filmDay | filmMonth |
| koCmanNm | photographer |
| koWnprzDiz | awardRaw → (파싱) awardDivision/awardGrade |
| koKeyWord | keywordsRaw → (파싱) season |
| orgImage/thumbImage | orgImageUrl/thumbImageUrl |
| cpyrhtDivCd | copyrightCode |
| (파싱) location | sido/sigungu |
| (지오코딩) | lat/lng |
| (집중률 매칭) | crowdAttractionName |

## 관광사진 — PhotoGalleryService1 (실시간)
- 목록 `/galleryList1`, **키워드 검색 `/gallerySearchList1` + keyword**(한글 인코딩), 상세 `/galleryDetailList1`.
| 외부 | 내부(PhotoDto) |
|------|---------------|
| galContentId | id |
| galTitle | title |
| galWebImageUrl (HTTP!) | imageUrl (→https) |
| galPhotographer | photographer |
| galPhotographyLocation | location |
| galPhotographyMonth | filmMonth |
| galSearchKeyword (콤마) | keywords[] |

## 집중률 — TatsCnctrRateService/tatsCnctrRatedList (실시간)
- 필수 `areaCd`+`signguCd`(코드표), 선택 `tAtsNm`.
| 외부 | 내부(CrowdForecast) |
|------|--------------------|
| baseYmd | daily[].date |
| cnctrRate | daily[].rate |
| areaNm/signguNm | areaNm/sigunguNm |
| tAtsNm | attractionName |
- 30일치가 관광지별로 옴 → 관광지명 그룹핑 후 daily 배열 구성. recommendedDates는 혼잡도 낮은 날 계산.
