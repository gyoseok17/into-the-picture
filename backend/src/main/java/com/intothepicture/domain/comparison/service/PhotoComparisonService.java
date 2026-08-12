package com.intothepicture.domain.comparison.service;

import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.ComparisonDto;
import com.intothepicture.domain.contest.dto.ContestMapper;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.domain.photorecord.repository.PhotoRecordRepository;
import com.intothepicture.domain.userphoto.service.UserPhotoService;
import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Legacy comparison API backed by PhotoRecord until the album UI migration. */
@Service
public class PhotoComparisonService {
    private final PhotoRecordRepository records;
    private final UserPhotoService photos;
    private final ContestRepository contests;

    public PhotoComparisonService(PhotoRecordRepository records, UserPhotoService photos, ContestRepository contests) {
        this.records = records; this.photos = photos; this.contests = contests;
    }

    @Transactional
    public ComparisonDto create(Long userId, Long recordId, Long contestId) {
        var record = photos.findOwnedRecord(userId, recordId);
        if (record.getContest() != null) throw new BusinessException(ErrorCode.CONFLICT, "이미 수상작과 연결된 사진입니다.");
        record.attachContest(contests.findById(contestId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND)));
        return dto(record);
    }

    @Transactional(readOnly = true)
    public List<ComparisonDto> list(Long userId) {
        return records.findAllByUserIdAndContestIsNotNullOrderByContestLinkedAtDesc(userId).stream().map(this::dto).toList();
    }

    @Transactional
    public ComparisonDto replacePhoto(Long userId, Long comparisonId, Long replacementRecordId) {
        var current = photos.findOwnedRecord(userId, comparisonId);
        if (current.getContest() == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        var replacement = photos.findOwnedRecord(userId, replacementRecordId);
        if (replacement.getContest() != null) throw new BusinessException(ErrorCode.CONFLICT, "이미 사진 놓기에 사용 중인 사진입니다.");
        var contest = current.getContest();
        current.detachContest();
        replacement.attachContest(contest);
        return dto(replacement);
    }

    @Transactional
    public void delete(Long userId, Long recordId, boolean deletePhoto) {
        var record = photos.findOwnedRecord(userId, recordId);
        if (record.getContest() == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        if (deletePhoto) {
            photos.deleteIncludingComparison(userId, recordId);
            return;
        }
        record.detachContest();
    }

    private ComparisonDto dto(com.intothepicture.domain.photorecord.entity.PhotoRecord record) {
        return new ComparisonDto(record.getId(), photos.dto(record), ContestMapper.toSummary(record.getContest()), record.getContestLinkedAt());
    }
}
