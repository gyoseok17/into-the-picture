-- 사용자가 승인한 실제 촬영 관점 보정. 원래 위치의 좌표·집중률 캐시는 새 위치와 일치하지 않으므로 다시 생성한다.
UPDATE contest_work
SET location = CASE title
        WHEN '단풍 물든 설악산 주전골' THEN '강원특별자치도 양양군, 주전골'
        WHEN '물안개가 빚은 한폭의 수채화' THEN '전남광주통합특별시 나주시, 죽산보'
        WHEN '장자도의 겨울 아침' THEN '전북특별자치도 군산시 옥도면, 장자도'
        WHEN '핸드폰 속으로' THEN '서울특별시 서초구, 반포 한강공원'
        WHEN '황금빛 운석충돌구' THEN '경상남도 합천군, 대암산 활공장'
    END,
    sido = CASE title
        WHEN '단풍 물든 설악산 주전골' THEN '강원특별자치도'
        WHEN '물안개가 빚은 한폭의 수채화' THEN '전남광주통합특별시'
        WHEN '장자도의 겨울 아침' THEN '전북특별자치도'
        WHEN '핸드폰 속으로' THEN '서울특별시'
        WHEN '황금빛 운석충돌구' THEN '경상남도'
    END,
    sigungu = CASE title
        WHEN '단풍 물든 설악산 주전골' THEN '양양군'
        WHEN '물안개가 빚은 한폭의 수채화' THEN '나주시'
        WHEN '장자도의 겨울 아침' THEN '군산시'
        WHEN '핸드폰 속으로' THEN '서초구'
        WHEN '황금빛 운석충돌구' THEN '합천군'
    END,
    lat = NULL,
    lng = NULL,
    crowd_attraction_name = NULL
WHERE title IN (
    '단풍 물든 설악산 주전골',
    '물안개가 빚은 한폭의 수채화',
    '장자도의 겨울 아침',
    '핸드폰 속으로',
    '황금빛 운석충돌구'
);
