package com.intothepicture.external.contest.sync;

import java.util.Map;

/**
 * 외부 공모전 원문 중 실제 촬영 관점이 키워드·작품 정보로 명확히 확인된 소수 항목의 표시 위치 보정.
 * 원문을 재동기화해도 사용자가 승인한 위치가 되돌아가지 않도록 sync 경계에서 적용한다.
 */
final class ContestLocationOverrides {

    private static final Map<String, String> LOCATIONS = Map.of(
        "단풍 물든 설악산 주전골", "강원특별자치도 양양군, 주전골",
        "물안개가 빚은 한폭의 수채화", "전남광주통합특별시 나주시, 죽산보",
        "장자도의 겨울 아침", "전북특별자치도 군산시 옥도면, 장자도",
        "핸드폰 속으로", "서울특별시 서초구, 반포 한강공원",
        "황금빛 운석충돌구", "경상남도 합천군, 대암산 활공장"
    );

    private ContestLocationOverrides() {
    }

    static String apply(String title, String externalLocation) {
        return LOCATIONS.getOrDefault(title, externalLocation);
    }
}
