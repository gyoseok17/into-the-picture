package com.intothepicture.domain.comparison.controller;

import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.PublicComparisonDto;
import com.intothepicture.domain.comparison.service.PhotoComparisonService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Publicly exposes only explicitly shared comparison images, never album record routes. */
@RestController
@RequestMapping("/contests/{contestId}/comparisons")
public class PublicContestComparisonController {
    private final PhotoComparisonService service;

    public PublicContestComparisonController(PhotoComparisonService service) { this.service = service; }

    @GetMapping
    public List<PublicComparisonDto> list(@PathVariable Long contestId) { return service.listPublic(contestId); }

    @GetMapping("/{comparisonId}/file")
    public ResponseEntity<Resource> file(@PathVariable Long contestId, @PathVariable Long comparisonId) {
        var file = service.loadPublicFile(contestId, comparisonId);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .contentType(MediaType.parseMediaType(file.contentType()))
            .contentLength(file.fileSize())
            .body(file.resource());
    }
}
