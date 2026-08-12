package com.intothepicture.domain.userphoto.storage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
@Component public class LocalFileStorage implements FileStorage {
 private final Path root; public LocalFileStorage(@Value("${app.storage.local-dir:./uploads}") String localDir) { this.root = Path.of(localDir).toAbsolutePath().normalize(); }
 public StoredFile store(Long userId, MultipartFile file) throws IOException { String ext = extension(file.getOriginalFilename()); String key = "u/" + userId + "/" + UUID.randomUUID() + ext; Path target = root.resolve(key).normalize(); if (!target.startsWith(root)) throw new IOException("Invalid storage path"); Files.createDirectories(target.getParent()); try (var input = file.getInputStream()) { Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING); } return new StoredFile(key, "/files/" + key); }
 public Resource load(String storageKey) throws IOException { Path target = root.resolve(storageKey).normalize(); if (!target.startsWith(root) || !Files.isRegularFile(target)) throw new IOException("File not found"); return new UrlResource(target.toUri()); }
 public void delete(String storageKey) throws IOException { Path target = root.resolve(storageKey).normalize(); if (target.startsWith(root)) Files.deleteIfExists(target); }
 private String extension(String name) { if (name == null) return ".jpg"; int dot = name.lastIndexOf('.'); return dot >= 0 && dot < name.length() - 1 ? name.substring(dot).toLowerCase() : ".jpg"; }
}
