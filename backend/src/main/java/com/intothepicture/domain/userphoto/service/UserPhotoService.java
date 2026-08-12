package com.intothepicture.domain.userphoto.service;

import com.intothepicture.domain.photorecord.entity.PhotoRecord;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.user.repository.UserRepository;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import com.intothepicture.domain.userphoto.entity.UserPhoto;
import com.intothepicture.domain.userphoto.repository.UserPhotoRepository;
import com.intothepicture.domain.userphoto.storage.FileStorage;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserPhotoService {
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");
    private final UserPhotoRepository photos;
    private final PhotoRecordRepository records;
    private final UserRepository users;
    private final FileStorage storage;

    public UserPhotoService(UserPhotoRepository photos, PhotoRecordRepository records, UserRepository users, FileStorage storage) {
        this.photos = photos; this.records = records; this.users = users; this.storage = storage;
    }

    @Transactional(readOnly = true)
    public List<UserPhotoDto> list(Long userId) {
        return records.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::dto).toList();
    }

    @Transactional
    public UserPhotoDto upload(Long userId, MultipartFile file, String memo) {
        validate(file);
        try {
            var user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
            var stored = storage.store(userId, file);
            var photo = photos.save(UserPhoto.builder().user(user).storageKey(stored.storageKey()).url(stored.url())
                .originalFilename(file.getOriginalFilename()).contentType(file.getContentType()).fileSize(file.getSize()).build());
            return dto(records.save(PhotoRecord.builder().user(user).userPhoto(photo).memo(blankToNull(memo)).build()));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "사진 저장에 실패했습니다.");
        }
    }

    @Transactional
    public void delete(Long userId, Long recordId) {
        deleteRecord(userId, recordId, false);
    }

    @Transactional
    public void deleteIncludingComparison(Long userId, Long recordId) {
        deleteRecord(userId, recordId, true);
    }

    private void deleteRecord(Long userId, Long recordId, boolean includeComparison) {
        var record = findOwnedRecord(userId, recordId);
        if (!includeComparison && record.getContest() != null) throw new BusinessException(ErrorCode.CONFLICT, "사진 놓기 기록에 사용 중인 사진은 삭제할 수 없습니다.");
        var photo = record.getUserPhoto();
        records.delete(record);
        if (!records.existsByUserPhotoId(photo.getId())) {
            photos.delete(photo);
            try { storage.delete(photo.getStorageKey()); } catch (IOException ignored) { }
        }
    }

    @Transactional(readOnly = true)
    public PhotoRecord findOwnedRecord(Long userId, Long recordId) {
        return records.findByIdAndUserId(recordId, userId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public PhotoFile load(Long userId, Long recordId) {
        var photo = findOwnedRecord(userId, recordId).getUserPhoto();
        try {
            return new PhotoFile(storage.load(photo.getStorageKey()), photo.getContentType(), photo.getFileSize());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
    }

    public UserPhotoDto dto(PhotoRecord record) {
        var photo = record.getUserPhoto();
        return new UserPhotoDto(record.getId(), "/me/photos/" + record.getId() + "/file", photo.getOriginalFilename(), photo.getContentType(), photo.getFileSize(), record.getTakenAt(), record.getMemo(), record.getCreatedAt());
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_SIZE || !ALLOWED.contains(file.getContentType()) || !hasImageSignature(file)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "JPEG, PNG, WebP 이미지(10MB 이하)만 업로드할 수 있습니다.");
        }
    }

    private boolean hasImageSignature(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] bytes = input.readNBytes(12); String type = file.getContentType();
            return ("image/jpeg".equals(type) && bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255)
                || ("image/png".equals(type) && bytes.length >= 8 && (bytes[0] & 255) == 137 && (bytes[1] & 255) == 80 && (bytes[2] & 255) == 78 && (bytes[3] & 255) == 71)
                || ("image/webp".equals(type) && bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P');
        } catch (IOException e) { return false; }
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public record PhotoFile(Resource resource, String contentType, Long fileSize) { }
}
