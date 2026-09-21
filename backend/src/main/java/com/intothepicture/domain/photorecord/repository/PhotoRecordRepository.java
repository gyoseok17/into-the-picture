package com.intothepicture.domain.photorecord.repository;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.comparison.entity.ComparisonVisibility;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhotoRecordRepository extends JpaRepository<PhotoRecord, Long> {
    List<PhotoRecord> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<PhotoRecord> findAllByUserIdAndContestIsNotNullOrderByContestLinkedAtDesc(Long userId);
    boolean existsByUserIdAndContestId(Long userId, Long contestId);
    boolean existsByUserIdAndContestIdAndIdNot(Long userId, Long contestId, Long id);
    Optional<PhotoRecord> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserPhotoId(Long userPhotoId);
    List<PhotoRecord> findAllByContestIdAndComparisonVisibilityOrderByContestLinkedAtDesc(
        Long contestId, ComparisonVisibility comparisonVisibility);
    Optional<PhotoRecord> findByIdAndContestIdAndComparisonVisibility(
        Long id, Long contestId, ComparisonVisibility comparisonVisibility);
    List<PhotoRecord> findAllByBundleIdOrderByCreatedAtAsc(Long bundleId);
    List<PhotoRecord> findAllByBundleIdInOrderByBundleIdAscCreatedAtAsc(Collection<Long> bundleIds);
    List<PhotoRecord> findAllByUserIdAndBundleIsNullOrderByCreatedAtDesc(Long userId);

    @Query("""
        select record from PhotoRecord record
        where record.user.id = :userId
        order by coalesce(record.takenAt, record.createdAt) desc, record.createdAt desc
        """)
    List<PhotoRecord> findAllByUserIdForAlbum(@Param("userId") Long userId);
}
