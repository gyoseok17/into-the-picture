package com.intothepicture.domain.contest.repository;

import com.intothepicture.domain.contest.dto.ContestSearchCondition;
import com.intothepicture.domain.contest.entity.ContestWork;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** contest 목록 동적 필터: season·grade·division·sido 정확일치 + keyword 부분일치(title/location/keywordsRaw). */
public final class ContestSpecifications {

    private ContestSpecifications() {
    }

    public static Specification<ContestWork> from(ContestSearchCondition cond) {
        return Specification
            .where(equals("season", cond.season()))
            .and(equals("awardGrade", cond.grade()))
            .and(equals("awardDivision", cond.division()))
            .and(equals("sido", cond.sido()))
            .and(keywordContains(cond.keyword()));
    }

    private static Specification<ContestWork> equals(String field, String value) {
        return (root, query, cb) ->
            StringUtils.hasText(value) ? cb.equal(root.get(field), value) : cb.conjunction();
    }

    private static Specification<ContestWork> keywordContains(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String like = "%" + keyword.toLowerCase() + "%";
            Predicate inTitle = cb.like(cb.lower(root.get("title")), like);
            Predicate inLocation = cb.like(cb.lower(root.get("location")), like);
            Predicate inKeywords = cb.like(cb.lower(root.get("keywordsRaw")), like);
            return cb.or(inTitle, inLocation, inKeywords);
        };
    }
}
