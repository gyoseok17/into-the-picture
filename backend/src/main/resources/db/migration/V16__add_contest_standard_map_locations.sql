-- M9: 수상작 95건의 검증된 지도 코드. 외부 주소를 실행 시점에 추측하지 않고,
-- 앨범 MapLocationCatalog와 같은 코드 체계를 수상작에도 명시적으로 저장한다.
ALTER TABLE contest_work
    ADD COLUMN map_region_code VARCHAR(20) NULL,
    ADD COLUMN map_city_code VARCHAR(50) NULL;

UPDATE contest_work AS contest
SET map_region_code = curated.map_region_code,
    map_city_code = curated.map_city_code
FROM (VALUES
    ('가야산 설경', 'GYEONGSANG', 'HAPCHEON'),
    ('가을 산사', 'GYEONGSANG', 'CHEONGDO'),
    ('겨울왕국', 'JEOLLA', 'MUJU'),
    ('경주 우연히 5', 'GYEONGSANG', 'GYEONGJU'),
    ('구인사 설경', 'CHUNGCHEONG', 'DANYANG'),
    ('구인사의 야경', 'CHUNGCHEONG', 'DANYANG'),
    ('군산 옥녀교차로 청보리밭', 'JEOLLA', 'GUNSAN'),
    ('금강굴 풍경', 'GANGWON', 'SOKCHO'),
    ('금성산성의 봄', 'JEOLLA', 'DAMYANG'),
    ('꽃피는 섬', 'CHUNGCHEONG', 'JINCHEON'),
    ('남미륵사의 봄꽃 아침', 'JEOLLA', 'GANGJIN'),
    ('눈 내린 어촌마을', 'GANGWON', 'SAMCHEOK'),
    ('단풍 물든 설악산 주전골', 'GANGWON', 'YANGYANG'),
    ('대가야의 숨결', 'GYEONGSANG', 'GORYEONG'),
    ('대둔산 일출과 함께', 'JEOLLA', 'WANJU'),
    ('대왕암 일출', 'GYEONGSANG', 'ULSAN'),
    ('대왕암의 가을', 'GYEONGSANG', 'ULSAN'),
    ('덕룡산의 진달래', 'JEOLLA', 'GANGJIN'),
    ('덕유산 겨울 왕국', 'JEOLLA', 'MUJU'),
    ('동백숲', 'JEJU', 'SEOGWIPO'),
    ('동화 속에 살아요', 'GYEONGSANG', 'BUSAN'),
    ('등나무 우주선', 'JEOLLA', 'DAMYANG'),
    ('마이산의 봄', 'JEOLLA', 'JINAN'),
    ('메밀꽃 필 무렵', 'JEJU', 'SEOGWIPO'),
    ('목장의 저녁', 'GANGWON', 'PYEONGCHANG'),
    ('뫼산을 그리다', 'CAPITAL', 'SEOUL'),
    ('물 들어오는 그 시간', 'CHUNGCHEONG', 'SEOSAN'),
    ('물고기의 겨울나기', 'JEOLLA', 'NAMWON'),
    ('물안개가 빚은 한폭의 수채화', 'JEOLLA', 'NAJU'),
    ('바다 협곡과 어부', 'GYEONGSANG', 'POHANG'),
    ('반영', 'JEOLLA', 'JANGSEONG'),
    ('방화수류정의 여름', 'CAPITAL', 'SUWON'),
    ('법주사의 가을', 'CHUNGCHEONG', 'BOEUN'),
    ('벚꽃나라 테라스', 'GYEONGSANG', 'POHANG'),
    ('보리밭 사이길', 'JEOLLA', 'GOCHANG'),
    ('보문정의 봄밤', 'GYEONGSANG', 'GYEONGJU'),
    ('봄이 춤추는 매화마을', 'JEOLLA', 'GWANGYANG'),
    ('불갑사 상사화', 'JEOLLA', 'YEONGGWANG'),
    ('불로동 고분군 겨울이야기', 'GYEONGSANG', 'DAEGU'),
    ('빛 축제 거리의 아침', 'GYEONGSANG', 'BUSAN'),
    ('산그리메', 'JEOLLA', 'WANJU'),
    ('산사의 설야', 'CAPITAL', 'INCHEON'),
    ('산정 호수', 'GYEONGSANG', 'HADONG'),
    ('상고대핀 양촌리', 'CHUNGCHEONG', 'CHUNGJU'),
    ('새해 소원', 'CAPITAL', 'SEOUL'),
    ('설대목 모란 전통오일장', 'CAPITAL', 'SEONGNAM'),
    ('소수서원의 설경', 'GYEONGSANG', 'YEONGJU'),
    ('송림의 아침', 'GYEONGSANG', 'GYEONGJU'),
    ('수종사의 가을', 'CAPITAL', 'NAMYANGJU'),
    ('순간의 찰나', 'JEJU', 'SEOGWIPO'),
    ('순천 선암사의 오색빛깔 봄', 'JEOLLA', 'SUNCHEON'),
    ('신라천년의 도시의 봄', 'GYEONGSANG', 'GYEONGJU'),
    ('신비의 낙안읍성', 'JEOLLA', 'SUNCHEON'),
    ('아가페 공원의 가을', 'JEOLLA', 'IKSAN'),
    ('아름다운 돌리네', 'GANGWON', 'JEONGSEON'),
    ('안개속 대가야 고분', 'GYEONGSANG', 'GORYEONG'),
    ('안개속의 낙안읍성', 'JEOLLA', 'SUNCHEON'),
    ('안동 하회마을의 봄', 'GYEONGSANG', 'ANDONG'),
    ('야간 고궁 특별함', 'CHUNGCHEONG', 'BUYEO'),
    ('역사와 함께 깊어진 가을', 'CAPITAL', 'SEOUL'),
    ('연천의 가을', 'CAPITAL', 'YEONCHEON'),
    ('염전체험', 'JEOLLA', 'SHINAN'),
    ('영취산의 봄', 'JEOLLA', 'YEOSU'),
    ('오도리주상절리2', 'GYEONGSANG', 'POHANG'),
    ('오름의 아침', 'JEJU', 'JEJU_CITY'),
    ('용굴촛대바위와 카약', 'GANGWON', 'SAMCHEOK'),
    ('우포의 가을아침', 'GYEONGSANG', 'CHANGNYEONG'),
    ('운해를 품은 밀양 영산정사의 와불상', 'GYEONGSANG', 'MIRYANG'),
    ('위양지의 아침', 'GYEONGSANG', 'MIRYANG'),
    ('장자도의 겨울 아침', 'JEOLLA', 'GUNSAN'),
    ('제주 사계해변의 여명', 'JEJU', 'SEOGWIPO'),
    ('제주도 이른 봄의 시작', 'JEJU', 'SEOGWIPO'),
    ('제주의 일몰', 'JEJU', 'SEOGWIPO'),
    ('천상의 화원 소백산', 'CHUNGCHEONG', 'DANYANG'),
    ('철쭉을 물든 아침의 빛', 'GYEONGSANG', 'HAPCHEON'),
    ('청보리밭 여명', 'JEOLLA', 'GOCHANG'),
    ('체화정의 겨울', 'GYEONGSANG', 'ANDONG'),
    ('폭설로 뒤덮인 속초 시내와 설악산의 해질녘', 'GANGWON', 'SOKCHO'),
    ('표충사의 여름', 'GYEONGSANG', 'MIRYANG'),
    ('푸른 바다목장', 'JEOLLA', 'WANDO'),
    ('푸른초원의 월출산', 'JEOLLA', 'YEONGAM'),
    ('하늘에서 본 첨성대', 'GYEONGSANG', 'GYEONGJU'),
    ('하늘을 걷는 시간', 'GYEONGSANG', 'POHANG'),
    ('한라산이 품은 차밭', 'JEJU', 'SEOGWIPO'),
    ('해운대 일몰', 'GYEONGSANG', 'BUSAN'),
    ('핸드폰 속으로', 'CAPITAL', 'SEOUL'),
    ('화려한 하늘 멋진 타워', 'CHUNGCHEONG', 'HONGSEONG'),
    ('황금빛 운석충돌구', 'GYEONGSANG', 'HAPCHEON'),
    ('흔적', 'JEJU', 'SEOGWIPO'),
    ('힐링 서프', 'GYEONGSANG', 'BUSAN'),
    ('10월의 축제 진주남강 유등축제', 'GYEONGSANG', 'JINJU'),
    ('1월 한파가 엄습한 돌문화공원', 'JEJU', 'JEJU_CITY'),
    ('2월 늦은 폭설이 만든 설경액자', 'CHUNGCHEONG', 'DANYANG'),
    ('6월 바다 안개가 건물을 감싸 안은 부산 해운대의 풍경', 'GYEONGSANG', 'BUSAN'),
    ('7월 고분군', 'GYEONGSANG', 'DAEGU')
) AS curated(title, map_region_code, map_city_code)
WHERE contest.title = curated.title;

-- 지오코더가 동명 장소를 잡아 생긴 네 수상작 좌표를 실제 촬영지의 장소 좌표로 보정한다.
UPDATE contest_work
SET lat = CASE title
        WHEN '벚꽃나라 테라스' THEN 36.0651092
        WHEN '하늘을 걷는 시간' THEN 36.0651092
        WHEN '영취산의 봄' THEN 34.8205286
        WHEN '표충사의 여름' THEN 35.5326461
    END,
    lng = CASE title
        WHEN '벚꽃나라 테라스' THEN 129.3904401
        WHEN '하늘을 걷는 시간' THEN 129.3904401
        WHEN '영취산의 봄' THEN 127.7167708
        WHEN '표충사의 여름' THEN 128.9594529
    END
WHERE title IN ('벚꽃나라 테라스', '하늘을 걷는 시간', '영취산의 봄', '표충사의 여름');
