# M10 지역 입력 경계 통합 — 백엔드 결과

## 변경 범위

- `MapLocationInputResolver`를 추가해 앨범 지도 지역 입력의 공통 쓰기 경계로 만들었다.
- 단건 사진 업로드(`UserPhotoUploadService`), 사진 기록 수정(`UserPhotoService`), 사진 묶음 업로드(`PhotoRecordBundleService`)가 모두 이 경계를 통해 지역·시군 코드를 정규화하고 검증한다.
- 세 서비스에 흩어져 있던 지역·시군 코드 길이 검증과 `MapLocationCatalog.resolve` 호출을 제거했다.

## 설계 결정과 이유

- 새 경계는 공백을 `null`로 바꾸고, 지역 32자·시군 48자 제한을 적용한다. 그 뒤 `MapLocationCatalog`에 위임해 대소문자 정규화, 존재 여부, 지역-시군 소속 관계를 검증한다.
- 입력 길이 같은 전송 경계 규칙과 카탈로그의 정식 코드·소속 규칙은 성격이 다르므로, 카탈로그 자체를 확장하지 않고 별도 resolver로 조합했다.
- 지도 조회·좌표 계산만 맡는 `PhotoRecordMapService`는 사용자 입력을 받지 않으므로 기존처럼 `MapLocationCatalog`를 직접 사용한다.

## 계약 영향

- API URL, DTO, DB 스키마, 저장되는 정식 지역·시군 코드, 오류 코드와 사용자 흐름은 변경하지 않았다.
- null/blank, 길이 초과, 지역 없는 시군, 다른 지역 소속 시군 모두 기존과 동일하게 `INVALID_REQUEST`가 된다.

## 검증

- `MapLocationInputResolverTest`: 공백/대소문자 정규화, 빈 선택, 지역 코드 길이 초과를 검증했다.
- `backend\\gradlew.bat test --no-daemon` 통과.
- 쓰기 서비스에서 직접 `MapLocationCatalog.resolve` 또는 지역·시군 코드 정규화 호출이 남지 않았음을 검색으로 확인했다.

## 남은 위험·후속

- 이 경계는 사진 기록의 쓰기 경로만 다룬다. 지도 조회용 카탈로그 사용은 입력 규칙 중복이 아니므로 통합하지 않았다.
