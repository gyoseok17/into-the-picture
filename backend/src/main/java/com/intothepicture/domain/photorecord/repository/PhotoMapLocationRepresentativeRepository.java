package com.intothepicture.domain.photorecord.repository;

import com.intothepicture.domain.photorecord.entity.PhotoMapLocationRepresentative;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoMapLocationRepresentativeRepository extends JpaRepository<PhotoMapLocationRepresentative, Long> {
    Optional<PhotoMapLocationRepresentative> findByUserIdAndLocationKey(Long userId, String locationKey);
    List<PhotoMapLocationRepresentative> findAllByUserIdAndRepresentativePhotoIsNotNull(Long userId);
}
