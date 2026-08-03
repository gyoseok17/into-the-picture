package com.intothepicture.domain.photo.controller;

import com.intothepicture.domain.photo.dto.PhotoDto;
import com.intothepicture.domain.photo.service.PhotoSearchService;
import com.intothepicture.global.response.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/photos")
public class PhotoController {
    private final PhotoSearchService photoSearchService;
    public PhotoController(PhotoSearchService photoSearchService) { this.photoSearchService = photoSearchService; }
    @GetMapping
    public PageResponse<PhotoDto> find(@RequestParam(required = false) String keyword, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size) {
        return photoSearchService.find(keyword, page, size);
    }
}
