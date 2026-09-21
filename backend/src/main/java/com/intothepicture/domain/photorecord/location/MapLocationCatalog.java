package com.intothepicture.domain.photorecord.location;

import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Stable location codes for the album map. The picker deliberately uses the
 * 2024-12-31 policy in docs/11-city-county-count.md: 8 metropolitan/special
 * cities themselves, 153 city/county options, and Jeju's two administrative
 * cities. Metropolitan-area counties are intentionally not selectable.
 */
@Component
public class MapLocationCatalog {
    private static final List<Region> REGIONS = List.of(
        region("CAPITAL", "수도권",
            city("SEOUL", "서울", 37.5665, 126.9780), city("INCHEON", "인천", 37.4563, 126.7052),
            city("SUWON", "수원", 37.2636, 127.0286), city("SEONGNAM", "성남", 37.4200, 127.1267), city("UIJEONGBU", "의정부", 37.7381, 127.0337), city("ANYANG", "안양", 37.3943, 126.9568), city("BUCHEON", "부천", 37.5034, 126.7660), city("GWANGMYEONG", "광명", 37.4786, 126.8644), city("PYEONGTAEK", "평택", 36.9921, 127.1129), city("DONGDUCHEON", "동두천", 37.9035, 127.0606), city("ANSAN", "안산", 37.3219, 126.8309), city("GOYANG", "고양", 37.6584, 126.8320), city("GWACHEON", "과천", 37.4292, 126.9877), city("GURI", "구리", 37.5943, 127.1296), city("NAMYANGJU", "남양주", 37.6360, 127.2165), city("OSAN", "오산", 37.1498, 127.0772), city("SIHEUNG", "시흥", 37.3802, 126.8029), city("GUNPO", "군포", 37.3616, 126.9352), city("UIWANG", "의왕", 37.3446, 126.9686), city("HANAM", "하남", 37.5393, 127.2148), city("YONGIN", "용인", 37.2411, 127.1776), city("PAJU", "파주", 37.7602, 126.7799), city("ICHEON", "이천", 37.2720, 127.4350), city("ANSEONG", "안성", 37.0081, 127.2799), city("GIMPO", "김포", 37.6152, 126.7156), city("HWASEONG", "화성", 37.1996, 126.8312), city("GYEONGGI_GWANGJU", "광주", 37.4294, 127.2550), city("YANGJU", "양주", 37.7853, 127.0458), city("POCHEON", "포천", 37.8949, 127.2003), city("YEOJU", "여주", 37.2982, 127.6370), city("GAPYEONG", "가평", 37.8315, 127.5095), city("YANGPYEONG", "양평", 37.4917, 127.4876), city("YEONCHEON", "연천", 38.0965, 127.0750)),
        region("GANGWON", "강원",
            city("CHUNCHEON", "춘천", 37.8813, 127.7298), city("WONJU", "원주", 37.3422, 127.9202), city("GANGNEUNG", "강릉", 37.7519, 128.8761), city("DONGHAE", "동해", 37.5247, 129.1143), city("TAEBAEK", "태백", 37.1641, 128.9856), city("SOKCHO", "속초", 38.2070, 128.5918), city("SAMCHEOK", "삼척", 37.4499, 129.1652), city("HONGCHEON", "홍천", 37.6970, 127.8887), city("HOENGSEONG", "횡성", 37.4918, 127.9850), city("YEONGWOL", "영월", 37.1835, 128.4614), city("PYEONGCHANG", "평창", 37.3705, 128.3902), city("JEONGSEON", "정선", 37.3806, 128.6609), city("CHEORWON", "철원", 38.1469, 127.3132), city("HWACHEON", "화천", 38.1062, 127.7087), city("YANGGU", "양구", 38.1099, 127.9907), city("INJE", "인제", 38.0697, 128.1704), city("GANGWON_GOSEONG", "고성", 38.3808, 128.4677), city("YANGYANG", "양양", 38.0754, 128.6191)),
        region("CHUNGCHEONG", "충청",
            city("DAEJEON", "대전", 36.3504, 127.3845), city("SEJONG", "세종", 36.4800, 127.2890), city("CHEONGJU", "청주", 36.6424, 127.4890), city("CHUNGJU", "충주", 36.9910, 127.9259), city("JECHON", "제천", 37.1326, 128.1910), city("BOEUN", "보은", 36.4895, 127.7295), city("OKCHEON", "옥천", 36.3064, 127.5713), city("YEONGDONG", "영동", 36.1750, 127.7834), city("JEUNGPYEONG", "증평", 36.7853, 127.5816), city("JINCHEON", "진천", 36.8554, 127.4356), city("GOESAN", "괴산", 36.8153, 127.7865), city("EUMSEONG", "음성", 36.9403, 127.6904), city("DANYANG", "단양", 36.9845, 128.3656), city("CHEONAN", "천안", 36.8151, 127.1139), city("GONGJU", "공주", 36.4465, 127.1190), city("BORYEONG", "보령", 36.3335, 126.6127), city("ASAN", "아산", 36.7898, 127.0019), city("SEOSAN", "서산", 36.7845, 126.4503), city("NONSAN", "논산", 36.1872, 127.0987), city("GYERYONG", "계룡", 36.2746, 127.2486), city("DANGJIN", "당진", 36.8890, 126.6459), city("GEUMSAN", "금산", 36.1089, 127.4882), city("BUYEO", "부여", 36.2757, 126.9098), city("SEOCHEON", "서천", 36.0803, 126.6914), city("CHEONGYANG", "청양", 36.4591, 126.8022), city("HONGSEONG", "홍성", 36.6012, 126.6608), city("YESAN", "예산", 36.6821, 126.8489), city("TAEAN", "태안", 36.7456, 126.2981)),
        region("JEOLLA", "전라",
            city("GWANGJU", "광주", 35.1595, 126.8526), city("JEONJU", "전주", 35.8242, 127.1480), city("GUNSAN", "군산", 35.9677, 126.7369), city("IKSAN", "익산", 35.9483, 126.9576), city("JEONGEUP", "정읍", 35.5699, 126.8560), city("NAMWON", "남원", 35.4164, 127.3904), city("GIMJE", "김제", 35.8036, 126.8809), city("WANJU", "완주", 35.9047, 127.1620), city("JINAN", "진안", 35.7917, 127.4248), city("MUJU", "무주", 36.0068, 127.6607), city("JANGSU", "장수", 35.6474, 127.5215), city("IMSIL", "임실", 35.6172, 127.2890), city("SUNCHANG", "순창", 35.3744, 127.1375), city("GOCHANG", "고창", 35.4358, 126.7021), city("BUAN", "부안", 35.7317, 126.7333), city("MOKPO", "목포", 34.8118, 126.3922), city("YEOSU", "여수", 34.7604, 127.6622), city("SUNCHEON", "순천", 34.9506, 127.4872), city("NAJU", "나주", 35.0158, 126.7108), city("GWANGYANG", "광양", 34.9407, 127.6959), city("DAMYANG", "담양", 35.3212, 126.9882), city("GOKSEONG", "곡성", 35.2819, 127.2920), city("GURYE", "구례", 35.2025, 127.4629), city("GOHEUNG", "고흥", 34.6112, 127.2843), city("BOSEONG", "보성", 34.7716, 127.0800), city("HWASUN", "화순", 35.0645, 126.9864), city("JANGHEUNG", "장흥", 34.6817, 126.9069), city("GANGJIN", "강진", 34.6421, 126.7672), city("HAENAM", "해남", 34.5733, 126.5989), city("YEONGAM", "영암", 34.8002, 126.6969), city("MUAN", "무안", 34.9905, 126.4817), city("HAMPYEONG", "함평", 35.0659, 126.5166), city("YEONGGWANG", "영광", 35.2771, 126.5120), city("JANGSEONG", "장성", 35.3018, 126.7848), city("WANDO", "완도", 34.3111, 126.7551), city("JINDO", "진도", 34.4868, 126.2635), city("SINAN", "신안", 34.8336, 126.3512)),
        region("GYEONGSANG", "경상",
            city("BUSAN", "부산", 35.1796, 129.0756), city("DAEGU", "대구", 35.8714, 128.6014), city("ULSAN", "울산", 35.5384, 129.3114), city("POHANG", "포항", 36.0190, 129.3435), city("GYEONGJU", "경주", 35.8562, 129.2247), city("GIMCHEON", "김천", 36.1398, 128.1136), city("ANDONG", "안동", 36.5684, 128.7294), city("GUMI", "구미", 36.1195, 128.3446), city("YEONGJU", "영주", 36.8057, 128.6241), city("YEONGCHEON", "영천", 35.9733, 128.9387), city("SANGJU", "상주", 36.4109, 128.1591), city("MUNGYEONG", "문경", 36.5861, 128.1868), city("GYEONGSAN", "경산", 35.8251, 128.7412), city("UISEONG", "의성", 36.3527, 128.6972), city("CHEONGSONG", "청송", 36.4362, 129.0570), city("YEONGYANG", "영양", 36.6667, 129.1124), city("YEONGDEOK", "영덕", 36.4150, 129.3650), city("CHEONGDO", "청도", 35.6474, 128.7342), city("GORYEONG", "고령", 35.7260, 128.2627), city("SEONGJU", "성주", 35.9192, 128.2829), city("CHILGOK", "칠곡", 35.9956, 128.4017), city("YECHEON", "예천", 36.6577, 128.4550), city("BONGHWA", "봉화", 36.8931, 128.7320), city("ULJIN", "울진", 36.9931, 129.4004), city("ULLEUNG", "울릉", 37.4845, 130.9057), city("CHANGWON", "창원", 35.2280, 128.6811), city("JINJU", "진주", 35.1800, 128.1076), city("TONGYEONG", "통영", 34.8544, 128.4331), city("SACHEON", "사천", 35.0037, 128.0642), city("GIMHAE", "김해", 35.2285, 128.8894), city("MIRYANG", "밀양", 35.5038, 128.7467), city("GEOJE", "거제", 34.8806, 128.6211), city("YANGSAN", "양산", 35.3350, 129.0372), city("UIRYEONG", "의령", 35.3222, 128.2617), city("HAMAN", "함안", 35.2726, 128.4065), city("CHANGNYEONG", "창녕", 35.5446, 128.4925), city("GYEONGNAM_GOSEONG", "고성", 34.9731, 128.3222), city("NAMHAE", "남해", 34.8377, 127.8925), city("HADONG", "하동", 35.0671, 127.7515), city("SANCHEONG", "산청", 35.4155, 127.8735), city("HAMYANG", "함양", 35.5205, 127.7253), city("GEOCHANG", "거창", 35.6867, 127.9095), city("HAPCHEON", "합천", 35.5666, 128.1658)),
        region("JEJU", "제주", city("JEJU_CITY", "제주시", 33.4996, 126.5312), city("SEOGWIPO", "서귀포", 33.2541, 126.5601))
    );

    private static final Map<String, Region> REGIONS_BY_CODE = REGIONS.stream().collect(Collectors.toUnmodifiableMap(Region::code, region -> region));
    private static final Map<String, City> CITIES_BY_CODE = REGIONS.stream().flatMap(region -> region.cities().stream()).collect(Collectors.toUnmodifiableMap(City::code, city -> city));

    public MapLocation resolve(String regionCode, String cityCode) {
        String normalizedRegion = normalize(regionCode); String normalizedCity = normalize(cityCode);
        if (normalizedRegion == null && normalizedCity == null) return MapLocation.empty();
        if (normalizedRegion == null) throw invalid("A map city needs its map region.");
        Region region = REGIONS_BY_CODE.get(normalizedRegion);
        if (region == null) throw invalid("Unknown map region.");
        if (normalizedCity == null) return new MapLocation(region.code(), null);
        City city = CITIES_BY_CODE.get(normalizedCity);
        if (city == null || !region.cities().contains(city)) throw invalid("The map city does not belong to the map region.");
        return new MapLocation(region.code(), city.code());
    }

    public Optional<City> city(String cityCode) { return Optional.ofNullable(normalize(cityCode)).map(CITIES_BY_CODE::get); }
    public List<Region> regions() { return REGIONS; }
    private static String normalize(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT); }
    private static BusinessException invalid(String message) { return new BusinessException(ErrorCode.INVALID_REQUEST, message); }
    private static Region region(String code, String label, City... cities) { return new Region(code, label, List.of(cities)); }
    private static City city(String code, String label, double latitude, double longitude) { return new City(code, label, latitude, longitude); }
    public record MapLocation(String regionCode, String cityCode) { public static MapLocation empty() { return new MapLocation(null, null); } }
    public record Region(String code, String label, List<City> cities) { }
    public record City(String code, String label, double latitude, double longitude) { }
}
