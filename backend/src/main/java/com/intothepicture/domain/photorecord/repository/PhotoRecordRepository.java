package com.intothepicture.domain.photorecord.repository;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoRecordRepository extends JpaRepository<PhotoRecord, Long> {
    List<PhotoRecord> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<PhotoRecord> findAllByUserIdAndContestIsNotNullOrderByContestLinkedAtDesc(Long userId);
    Optional<PhotoRecord> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserPhotoId(Long userPhotoId);
}
