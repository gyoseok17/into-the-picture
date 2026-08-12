package com.intothepicture.domain.comparison.controller;
import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.ComparisonDto;
import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.CreateRequest;
import com.intothepicture.domain.comparison.dto.PhotoComparisonDtos.ReplacePhotoRequest;
import com.intothepicture.domain.comparison.service.PhotoComparisonService;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/me/comparisons") public class PhotoComparisonController { private final PhotoComparisonService service; public PhotoComparisonController(PhotoComparisonService service){this.service=service;} @GetMapping public List<ComparisonDto> list(@AuthenticationPrincipal JwtPrincipal p){return service.list(p.userId());} @PostMapping public ComparisonDto create(@AuthenticationPrincipal JwtPrincipal p,@RequestBody CreateRequest request){return service.create(p.userId(),request.userPhotoId(),request.contestId());} @PatchMapping("/{comparisonId}") public ComparisonDto replacePhoto(@AuthenticationPrincipal JwtPrincipal p,@PathVariable Long comparisonId,@RequestBody ReplacePhotoRequest request){return service.replacePhoto(p.userId(),comparisonId,request.userPhotoId());} @DeleteMapping("/{comparisonId}") public ResponseEntity<Void> delete(@AuthenticationPrincipal JwtPrincipal p,@PathVariable Long comparisonId,@RequestParam(defaultValue="false") boolean deletePhoto){service.delete(p.userId(),comparisonId,deletePhoto);return ResponseEntity.noContent().build();} }
