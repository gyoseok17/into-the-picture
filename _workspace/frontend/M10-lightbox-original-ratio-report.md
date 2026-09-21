# M10 스토리 묶음 확대 원본 비율 보고

- 작업 범위: `PhotoRecordAlbum`의 `PhotoBundleLightbox` 큰 사진 영역만 변경했다.
- 변경: 고정 `4:3` `AspectImage`를 인증이 필요한 개인 사진 URL도 처리하는 `ImageSource` 기반의 `object-contain` 이미지로 교체했다. 최대 높이와 너비만 뷰포트에 맞춰 제한하므로 가로·세로 원본 비율 전체가 보인다.
- 유지: 수상작 비교의 크롭·고정 비율, 스토리 카드와 썸네일의 비율, 큰 사진의 좌우 클릭·키보드 순환 탐색·닫기 흐름은 수정하지 않았다.
- 검증: `frontend npm run build`, 저장소 루트 `git diff --check` 통과. Vite의 500 kB 청크 경고는 기존 번들 분할 후속 과제이며 이번 변경으로 새로 생긴 오류는 아니다.
