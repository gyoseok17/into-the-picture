package com.intothepicture.external.contest.sync;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.contest.repository.ContestRepository;
import com.intothepicture.external.contest.client.ContestApiClient;
import com.intothepicture.external.contest.dto.ContestApiItem;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ContestSyncJobTest {

    @Mock
    private ContestApiClient contestApiClient;

    @Mock
    private ContestRepository contestRepository;

    @InjectMocks
    private ContestSyncJob contestSyncJob;

    private ContestApiItem item(String contentId, String title) {
        return new ContestApiItem(
            contentId, title, title + "_en",
            "경상남도 합천군, 가야산국립공원", "Gayasan, Hapcheon",
            "48", "서정철", "Seo", "202401",
            "스마트폰 부문 [입선]",
            "가야산 설경, 경상남도 합천군, 겨울, 눈",
            "https://img/org.jpg", "https://img/thumb.jpg", "Type1",
            LocalDateTime.of(2024, 11, 13, 16, 0, 22), LocalDateTime.of(2024, 12, 5, 18, 11, 46));
    }

    @Test
    @DisplayName("신규는 저장하고 기존(contentId 존재)은 건너뛴다 — insert-if-absent")
    void insertsNewSkipsExisting() {
        when(contestApiClient.fetchAll()).thenReturn(List.of(item("NEW1", "신규"), item("OLD1", "기존")));
        when(contestRepository.existsByContentId("NEW1")).thenReturn(false);
        when(contestRepository.existsByContentId("OLD1")).thenReturn(true);

        ContestSyncResult result = contestSyncJob.sync();

        assertThat(result.fetched()).isEqualTo(2);
        assertThat(result.inserted()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(1);
        verify(contestRepository, times(1)).save(any(ContestWork.class));
    }

    @Test
    @DisplayName("저장 엔티티에 원문 + 파싱값(부문/등급/시도/시군구/계절)이 함께 들어간다")
    void persistsRawAndParsedFields() {
        when(contestApiClient.fetchAll()).thenReturn(List.of(item("C1", "가야산 설경")));
        when(contestRepository.existsByContentId("C1")).thenReturn(false);

        contestSyncJob.sync();

        ArgumentCaptor<ContestWork> captor = ArgumentCaptor.forClass(ContestWork.class);
        verify(contestRepository).save(captor.capture());
        ContestWork saved = captor.getValue();
        assertThat(saved.getContentId()).isEqualTo("C1");
        assertThat(saved.getAwardRaw()).isEqualTo("스마트폰 부문 [입선]"); // 원문 보존
        assertThat(saved.getAwardDivision()).isEqualTo("스마트폰 부문");
        assertThat(saved.getAwardGrade()).isEqualTo("입선");
        assertThat(saved.getSido()).isEqualTo("경상남도");
        assertThat(saved.getSigungu()).isEqualTo("합천군");
        assertThat(saved.getSeason()).isEqualTo("겨울");
        assertThat(saved.getSyncedAt()).isNotNull();
        assertThat(saved.hasCoordinates()).isFalse(); // 보강은 이후 배치
    }

    @Test
    @DisplayName("승인된 촬영지 보정은 동기화 시에도 유지한다")
    void appliesApprovedLocationOverride() {
        when(contestApiClient.fetchAll()).thenReturn(List.of(item("C1", "황금빛 운석충돌구")));
        when(contestRepository.existsByContentId("C1")).thenReturn(false);

        contestSyncJob.sync();

        ArgumentCaptor<ContestWork> captor = ArgumentCaptor.forClass(ContestWork.class);
        verify(contestRepository).save(captor.capture());
        assertThat(captor.getValue().getLocation()).isEqualTo("경상남도 합천군, 대암산 활공장");
        assertThat(captor.getValue().getSigungu()).isEqualTo("합천군");
    }

    @Test
    @DisplayName("contentId 없는 항목은 저장하지 않고 skip")
    void skipsItemWithoutContentId() {
        when(contestApiClient.fetchAll()).thenReturn(List.of(item(null, "식별자없음")));

        ContestSyncResult result = contestSyncJob.sync();

        assertThat(result.inserted()).isZero();
        assertThat(result.skipped()).isEqualTo(1);
        verify(contestRepository, never()).save(any());
    }
}
