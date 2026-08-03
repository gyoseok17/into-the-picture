package com.intothepicture.domain.photo.service;

import com.intothepicture.domain.photo.dto.PhotoDto;
import com.intothepicture.external.photo.PhotoGalleryClient;
import com.intothepicture.global.response.PageResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PhotoSearchService {
    private final PhotoGalleryClient photoGalleryClient;
    public PhotoSearchService(PhotoGalleryClient photoGalleryClient) { this.photoGalleryClient = photoGalleryClient; }
    public PageResponse<PhotoDto> find(String keyword, int page, int size) {
        int safePage = Math.max(page, 1); int safeSize = size < 1 ? 20 : Math.min(size, 50);
        var result = photoGalleryClient.find(normalize(keyword), safePage, safeSize);
        return new PageResponse<>(result.content(), new PageResponse.PageMeta(safePage, safeSize, result.totalCount(), safePage * safeSize < result.totalCount()));
    }
    private String normalize(String value) { if (value == null) return null; String normalized = value.strip().replaceAll("\\s+", " "); return normalized.isEmpty() ? null : normalized; }
}
