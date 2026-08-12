package com.intothepicture.domain.userphoto.repository;
import com.intothepicture.domain.userphoto.entity.UserPhoto;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {
    Optional<UserPhoto> findByIdAndUserId(Long id, Long userId);
}
