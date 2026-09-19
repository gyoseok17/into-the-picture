package com.intothepicture.domain.photorecord.repository;

import com.intothepicture.domain.photorecord.entity.PhotoRecordBundle;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoRecordBundleRepository extends JpaRepository<PhotoRecordBundle, Long> {
    Optional<PhotoRecordBundle> findByIdAndUserId(Long id, Long userId);
    List<PhotoRecordBundle> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
