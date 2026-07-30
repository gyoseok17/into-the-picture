package com.intothepicture.global.response;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * 목록 공통 응답 래퍼(docs/04): { content, page:{ page, size, totalCount, hasNext } }.
 * page 는 1-based(첫 페이지 = 1).
 */
public record PageResponse<T>(List<T> content, PageMeta page) {

    public record PageMeta(int page, int size, long totalCount, boolean hasNext) {
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            new PageMeta(page.getNumber() + 1, page.getSize(), page.getTotalElements(), page.hasNext())
        );
    }
}
