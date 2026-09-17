package com.intothepicture.domain.photorecord.repository;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.comparison.entity.ComparisonVisibility;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhotoRecordRepository extends JpaRepository<PhotoRecord, Long> {
    List<PhotoRecord> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<PhotoRecord> findAllByUserIdAndContestIsNotNullOrderByContestLinkedAtDesc(Long userId);
    boolean existsByUserIdAndContestId(Long userId, Long contestId);
    Optional<PhotoRecord> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserPhotoId(Long userPhotoId);
    List<PhotoRecord> findAllByContestIdAndComparisonVisibilityAndArchivedAtIsNullOrderByContestLinkedAtDesc(
        Long contestId, ComparisonVisibility comparisonVisibility);
    Optional<PhotoRecord> findByIdAndContestIdAndComparisonVisibilityAndArchivedAtIsNull(
        Long id, Long contestId, ComparisonVisibility comparisonVisibility);
    List<PhotoRecord> findAllByBundleIdOrderByCreatedAtAsc(Long bundleId);
    List<PhotoRecord> findAllByUserIdAndBundleIsNullAndArchivedAtIsNullOrderByCreatedAtDesc(Long userId);
    List<PhotoRecord> findAllByUserIdAndBundleIsNullAndArchivedAtIsNotNullOrderByCreatedAtDesc(Long userId);

    @Query("""
        select record from PhotoRecord record
        where record.user.id = :userId
          and ((:archived = true and record.archivedAt is not null)
               or (:archived = false and record.archivedAt is null))
        order by coalesce(record.takenAt, record.createdAt) desc, record.createdAt desc
        """)
    List<PhotoRecord> findAllByUserIdAndArchived(@Param("userId") Long userId, @Param("archived") boolean archived);
}
