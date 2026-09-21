-- M10.1: V16에 기록된 이전 표기 SHINAN을 앨범 지도 카탈로그의 정식 코드 SINAN으로 보정한다.
-- V16은 이미 적용된 환경이 있으므로 수정하지 않는다.
UPDATE contest_work
SET map_city_code = 'SINAN'
WHERE map_city_code = 'SHINAN';
