package com.intothepicture.external.contest.sync;

import java.util.Map;

/**
 * 수상작별로 검증해 고정한 지도 위치 참조 데이터.
 *
 * <p>외부 API의 자유 형식 주소나 지오코딩 결과를 실행 시점에 추측하지 않는다. 새 DB에서 sync가 먼저
 * 실행되는 경우에도 Flyway의 기존 행 보정과 같은 결과가 나와야 하므로, 이 경계에서 위치 코드와
 * 좌표 보정을 같이 적용한다.
 */
final class ContestLocationOverrides {

    private static final Map<String, String> DISPLAY_LOCATION_OVERRIDES = Map.of(
        "단풍 물든 설악산 주전골", "강원특별자치도 양양군, 주전골",
        "물안개가 빚은 한폭의 수채화", "전남광주통합특별시 나주시, 죽산보",
        "장자도의 겨울 아침", "전북특별자치도 군산시 옥도면, 장자도",
        "핸드폰 속으로", "서울특별시 서초구, 반포 한강공원",
        "황금빛 운석충돌구", "경상남도 합천군, 대암산 활공장"
    );

    private static final Map<String, MapLocation> MAP_LOCATIONS = Map.ofEntries(
        entry("가야산 설경", "GYEONGSANG", "HAPCHEON"),
        entry("가을 산사", "GYEONGSANG", "CHEONGDO"),
        entry("겨울왕국", "JEOLLA", "MUJU"),
        entry("경주 우연히 5", "GYEONGSANG", "GYEONGJU"),
        entry("구인사 설경", "CHUNGCHEONG", "DANYANG"),
        entry("구인사의 야경", "CHUNGCHEONG", "DANYANG"),
        entry("군산 옥녀교차로 청보리밭", "JEOLLA", "GUNSAN"),
        entry("금강굴 풍경", "GANGWON", "SOKCHO"),
        entry("금성산성의 봄", "JEOLLA", "DAMYANG"),
        entry("꽃피는 섬", "CHUNGCHEONG", "JINCHEON"),
        entry("남미륵사의 봄꽃 아침", "JEOLLA", "GANGJIN"),
        entry("눈 내린 어촌마을", "GANGWON", "SAMCHEOK"),
        entry("단풍 물든 설악산 주전골", "GANGWON", "YANGYANG"),
        entry("대가야의 숨결", "GYEONGSANG", "GORYEONG"),
        entry("대둔산 일출과 함께", "JEOLLA", "WANJU"),
        entry("대왕암 일출", "GYEONGSANG", "ULSAN"),
        entry("대왕암의 가을", "GYEONGSANG", "ULSAN"),
        entry("덕룡산의 진달래", "JEOLLA", "GANGJIN"),
        entry("덕유산 겨울 왕국", "JEOLLA", "MUJU"),
        entry("동백숲", "JEJU", "SEOGWIPO"),
        entry("동화 속에 살아요", "GYEONGSANG", "BUSAN"),
        entry("등나무 우주선", "JEOLLA", "DAMYANG"),
        entry("마이산의 봄", "JEOLLA", "JINAN"),
        entry("메밀꽃 필 무렵", "JEJU", "SEOGWIPO"),
        entry("목장의 저녁", "GANGWON", "PYEONGCHANG"),
        entry("뫼산을 그리다", "CAPITAL", "SEOUL"),
        entry("물 들어오는 그 시간", "CHUNGCHEONG", "SEOSAN"),
        entry("물고기의 겨울나기", "JEOLLA", "NAMWON"),
        entry("물안개가 빚은 한폭의 수채화", "JEOLLA", "NAJU"),
        entry("바다 협곡과 어부", "GYEONGSANG", "POHANG"),
        entry("반영", "JEOLLA", "JANGSEONG"),
        entry("방화수류정의 여름", "CAPITAL", "SUWON"),
        entry("법주사의 가을", "CHUNGCHEONG", "BOEUN"),
        entry("벚꽃나라 테라스", "GYEONGSANG", "POHANG"),
        entry("보리밭 사이길", "JEOLLA", "GOCHANG"),
        entry("보문정의 봄밤", "GYEONGSANG", "GYEONGJU"),
        entry("봄이 춤추는 매화마을", "JEOLLA", "GWANGYANG"),
        entry("불갑사 상사화", "JEOLLA", "YEONGGWANG"),
        entry("불로동 고분군 겨울이야기", "GYEONGSANG", "DAEGU"),
        entry("빛 축제 거리의 아침", "GYEONGSANG", "BUSAN"),
        entry("산그리메", "JEOLLA", "WANJU"),
        entry("산사의 설야", "CAPITAL", "INCHEON"),
        entry("산정 호수", "GYEONGSANG", "HADONG"),
        entry("상고대핀 양촌리", "CHUNGCHEONG", "CHUNGJU"),
        entry("새해 소원", "CAPITAL", "SEOUL"),
        entry("설대목 모란 전통오일장", "CAPITAL", "SEONGNAM"),
        entry("소수서원의 설경", "GYEONGSANG", "YEONGJU"),
        entry("송림의 아침", "GYEONGSANG", "GYEONGJU"),
        entry("수종사의 가을", "CAPITAL", "NAMYANGJU"),
        entry("순간의 찰나", "JEJU", "SEOGWIPO"),
        entry("순천 선암사의 오색빛깔 봄", "JEOLLA", "SUNCHEON"),
        entry("신라천년의 도시의 봄", "GYEONGSANG", "GYEONGJU"),
        entry("신비의 낙안읍성", "JEOLLA", "SUNCHEON"),
        entry("아가페 공원의 가을", "JEOLLA", "IKSAN"),
        entry("아름다운 돌리네", "GANGWON", "JEONGSEON"),
        entry("안개속 대가야 고분", "GYEONGSANG", "GORYEONG"),
        entry("안개속의 낙안읍성", "JEOLLA", "SUNCHEON"),
        entry("안동 하회마을의 봄", "GYEONGSANG", "ANDONG"),
        entry("야간 고궁 특별함", "CHUNGCHEONG", "BUYEO"),
        entry("역사와 함께 깊어진 가을", "CAPITAL", "SEOUL"),
        entry("연천의 가을", "CAPITAL", "YEONCHEON"),
        entry("염전체험", "JEOLLA", "SHINAN"),
        entry("영취산의 봄", "JEOLLA", "YEOSU"),
        entry("오도리주상절리2", "GYEONGSANG", "POHANG"),
        entry("오름의 아침", "JEJU", "JEJU_CITY"),
        entry("용굴촛대바위와 카약", "GANGWON", "SAMCHEOK"),
        entry("우포의 가을아침", "GYEONGSANG", "CHANGNYEONG"),
        entry("운해를 품은 밀양 영산정사의 와불상", "GYEONGSANG", "MIRYANG"),
        entry("위양지의 아침", "GYEONGSANG", "MIRYANG"),
        entry("장자도의 겨울 아침", "JEOLLA", "GUNSAN"),
        entry("제주 사계해변의 여명", "JEJU", "SEOGWIPO"),
        entry("제주도 이른 봄의 시작", "JEJU", "SEOGWIPO"),
        entry("제주의 일몰", "JEJU", "SEOGWIPO"),
        entry("천상의 화원 소백산", "CHUNGCHEONG", "DANYANG"),
        entry("철쭉을 물든 아침의 빛", "GYEONGSANG", "HAPCHEON"),
        entry("청보리밭 여명", "JEOLLA", "GOCHANG"),
        entry("체화정의 겨울", "GYEONGSANG", "ANDONG"),
        entry("폭설로 뒤덮인 속초 시내와 설악산의 해질녘", "GANGWON", "SOKCHO"),
        entry("표충사의 여름", "GYEONGSANG", "MIRYANG"),
        entry("푸른 바다목장", "JEOLLA", "WANDO"),
        entry("푸른초원의 월출산", "JEOLLA", "YEONGAM"),
        entry("하늘에서 본 첨성대", "GYEONGSANG", "GYEONGJU"),
        entry("하늘을 걷는 시간", "GYEONGSANG", "POHANG"),
        entry("한라산이 품은 차밭", "JEJU", "SEOGWIPO"),
        entry("해운대 일몰", "GYEONGSANG", "BUSAN"),
        entry("핸드폰 속으로", "CAPITAL", "SEOUL"),
        entry("화려한 하늘 멋진 타워", "CHUNGCHEONG", "HONGSEONG"),
        entry("황금빛 운석충돌구", "GYEONGSANG", "HAPCHEON"),
        entry("흔적", "JEJU", "SEOGWIPO"),
        entry("힐링 서프", "GYEONGSANG", "BUSAN"),
        entry("10월의 축제 진주남강 유등축제", "GYEONGSANG", "JINJU"),
        entry("1월 한파가 엄습한 돌문화공원", "JEJU", "JEJU_CITY"),
        entry("2월 늦은 폭설이 만든 설경액자", "CHUNGCHEONG", "DANYANG"),
        entry("6월 바다 안개가 건물을 감싸 안은 부산 해운대의 풍경", "GYEONGSANG", "BUSAN"),
        entry("7월 고분군", "GYEONGSANG", "DAEGU")
    );

    // OpenStreetMap 장소 노드/피크를 2026-09-19에 확인한 좌표. 제목이나 지명 동명이로
    // 지오코딩이 다른 지역을 잡았던 네 작품만 명시적으로 보정한다.
    private static final Map<String, Coordinate> COORDINATE_OVERRIDES = Map.of(
        "벚꽃나라 테라스", new Coordinate(36.0651092, 129.3904401),
        "하늘을 걷는 시간", new Coordinate(36.0651092, 129.3904401),
        "영취산의 봄", new Coordinate(34.8205286, 127.7167708),
        "표충사의 여름", new Coordinate(35.5326461, 128.9594529)
    );

    private ContestLocationOverrides() {
    }

    static ResolvedLocation resolve(String title, String externalLocation) {
        MapLocation mapLocation = MAP_LOCATIONS.get(title);
        Coordinate coordinate = COORDINATE_OVERRIDES.get(title);
        return new ResolvedLocation(
            DISPLAY_LOCATION_OVERRIDES.getOrDefault(title, externalLocation),
            mapLocation == null ? null : mapLocation.regionCode(),
            mapLocation == null ? null : mapLocation.cityCode(),
            coordinate == null ? null : coordinate.lat(),
            coordinate == null ? null : coordinate.lng()
        );
    }

    static int curatedLocationCount() {
        return MAP_LOCATIONS.size();
    }

    private static Map.Entry<String, MapLocation> entry(String title, String regionCode, String cityCode) {
        return Map.entry(title, new MapLocation(regionCode, cityCode));
    }

    record ResolvedLocation(String location, String mapRegionCode, String mapCityCode, Double lat, Double lng) {
    }

    private record MapLocation(String regionCode, String cityCode) {
    }

    private record Coordinate(double lat, double lng) {
    }
}
