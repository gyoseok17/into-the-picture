package com.intothepicture.external.crowd;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * 시군구 코드표(resources/sigungu-codes.json) 조회. 집중률 API 는 areaCd+signguCd 가 필수인데
 * 공모전의 lDongRegnCd(=sidoCode)가 일부 누락·오기여서 신뢰할 수 없다. 따라서 <b>시군구명 우선</b>으로
 * 해석하고(전국적으로 거의 유일), 동구/남구처럼 중복되는 이름만 areaCd 로 보조 판별한다.
 *
 * <p>시군구명은 공백 제거 정규화로 비교한다("포항시 남구" ↔ 코드표 "포항시 남구", "가야산 국립공원" 변형 방어).
 */
@Component
public class SigunguCodeTable {

    private final Map<String, List<SigunguCode>> byName;

    public SigunguCodeTable(ObjectMapper objectMapper) {
        this.byName = load(objectMapper).stream()
            .collect(Collectors.groupingBy(code -> normalize(code.sigunguNm())));
    }

    /**
     * (sidoCode, 시군구명) → 코드 1건. 유일하면 sidoCode 무시(누락/오기 방어), 중복 이름이면 areaCd 로 판별.
     * 해석 실패 시 {@link Optional#empty()}(집중률 생략 = graceful).
     */
    public Optional<SigunguCode> resolve(String sidoCode, String sigunguName) {
        if (sigunguName == null || sigunguName.isBlank()) {
            return Optional.empty();
        }
        List<SigunguCode> candidates = byName.getOrDefault(normalize(sigunguName), List.of());
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        if (candidates.size() == 1) {
            return Optional.of(candidates.get(0));
        }
        return candidates.stream()
            .filter(code -> code.areaCd().equals(sidoCode))
            .findFirst();
    }

    private static String normalize(String name) {
        return name == null ? "" : name.replaceAll("\\s+", "");
    }

    private List<SigunguCode> load(ObjectMapper objectMapper) {
        try (InputStream in = new ClassPathResource("sigungu-codes.json").getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<List<SigunguCode>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("시군구 코드표(sigungu-codes.json) 로드 실패", e);
        }
    }
}
