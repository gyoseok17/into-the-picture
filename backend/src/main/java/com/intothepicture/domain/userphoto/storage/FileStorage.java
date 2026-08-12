package com.intothepicture.domain.userphoto.storage;
import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
public interface FileStorage { StoredFile store(Long userId, MultipartFile file) throws IOException; Resource load(String storageKey) throws IOException; void delete(String storageKey) throws IOException; record StoredFile(String storageKey, String url) {} }
