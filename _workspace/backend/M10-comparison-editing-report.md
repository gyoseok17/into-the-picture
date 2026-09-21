# M10 비교 결과 수정 백엔드 보고

## 변경 범위

- `PhotoComparisonService.replacePhoto`
- `PhotoComparisonService.changeCrop`
- `PhotoRecordRepository`
- `PhotoComparisonServiceTest`

## 결정과 이유

- 사진 변경은 기존 비교 기록의 수상작 연결을 새 소유 사진으로 옮긴다. 이전 사진의 파일·앨범 기록은 보존하고, 기존 공개/비공개 상태를 새 비교 기록으로 이어받는다.
- 대상 사진이 이미 수상작에 연결됐는지 확인하고, 수정 대상 외 동일 수상작 연결이 존재하면 연결을 옮기기 전에 `409`로 중단한다. 잘못된 중복 상태에서 기존 연결이 풀리는 것을 막는다.
- 크롭 변경 요청에 `crop`이 없으면 이전에는 성공 응답만 내고 아무 변경도 하지 않았다. 이제 `400 INVALID_REQUEST`로 명시적으로 거절한다.
- 사진 변경 요청의 `userPhotoId` 누락도 `400 INVALID_REQUEST`로 처리한다.

## 검증

- `backend\\gradlew.bat test --tests com.intothepicture.domain.comparison.service.PhotoComparisonServiceTest` 및 전체 `backend\\gradlew.bat test` 통과.
- 추가 단위 테스트: 빈 크롭 거절, 동일 수상작의 다른 연결 충돌 시 연결 변경 전 중단, 교체 사진 ID 누락 거절.

## 남은 위험

- 현재 데이터 모델은 과거 데이터 보존을 위해 `(user_id, contest_id)`의 DB 유니크 제약을 두지 않는다. 서비스 수준 충돌 검사는 일반 요청을 막지만, 같은 수상작에 대한 동시 요청의 완전한 직렬화는 별도 잠금/제약 설계가 필요하다.
