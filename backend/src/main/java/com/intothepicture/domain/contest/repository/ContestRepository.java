package com.intothepicture.domain.contest.repository;

import com.intothepicture.domain.contest.entity.ContestWork;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

/**
 * 공모전 수상작 저장소. external 의 sync 가 findByContentId/save 로 upsert,
 * contest 도메인이 동적 필터(Specification)·필터옵션(distinct)을 조회한다.
 */
public interface ContestRepository
    extends JpaRepository<ContestWork, Long>, JpaSpecificationExecutor<ContestWork> {

    Optional<ContestWork> findByContentId(String contentId);

    boolean existsByContentId(String contentId);

    @Query("select distinct c.season from ContestWork c where c.season is not null order by c.season")
    List<String> findDistinctSeasons();

    @Query("select distinct c.awardGrade from ContestWork c where c.awardGrade is not null order by c.awardGrade")
    List<String> findDistinctGrades();

    @Query("select distinct c.awardDivision from ContestWork c where c.awardDivision is not null order by c.awardDivision")
    List<String> findDistinctDivisions();

    @Query("select distinct c.sido from ContestWork c where c.sido is not null order by c.sido")
    List<String> findDistinctSidos();
}
