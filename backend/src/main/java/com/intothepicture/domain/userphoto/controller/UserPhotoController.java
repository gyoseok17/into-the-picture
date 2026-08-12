package com.intothepicture.domain.userphoto.controller;
import com.intothepicture.domain.userphoto.dto.UserPhotoDto;
import com.intothepicture.domain.userphoto.service.UserPhotoService;
import com.intothepicture.global.security.JwtService.JwtPrincipal;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
@RestController @RequestMapping("/me/photos") public class UserPhotoController { private final UserPhotoService service; public UserPhotoController(UserPhotoService service){this.service=service;} @GetMapping public List<UserPhotoDto> list(@AuthenticationPrincipal JwtPrincipal p){return service.list(p.userId());} @GetMapping("/{photoId}/file") public ResponseEntity<Resource> file(@AuthenticationPrincipal JwtPrincipal p,@PathVariable Long photoId){var file=service.load(p.userId(),photoId); return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType())).contentLength(file.fileSize()).body(file.resource());} @PostMapping(consumes="multipart/form-data") public UserPhotoDto upload(@AuthenticationPrincipal JwtPrincipal p,@RequestParam MultipartFile file,@RequestParam(required=false) String memo){return service.upload(p.userId(),file,memo);} @DeleteMapping("/{photoId}") public ResponseEntity<Void> delete(@AuthenticationPrincipal JwtPrincipal p,@PathVariable Long photoId){service.delete(p.userId(),photoId);return ResponseEntity.noContent().build();} }
