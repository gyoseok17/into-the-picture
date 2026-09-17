package com.intothepicture.domain.userphoto.storage;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class LocalFileStorage implements FileStorage {
    private final Path root;

    public LocalFileStorage(@Value("${app.storage.local-dir:./uploads}") String localDir) {
        this.root = Path.of(localDir).toAbsolutePath().normalize();
    }

    @Override
    public StoredFile store(Long userId, MultipartFile file) throws IOException {
        String key = "u/" + userId + "/" + UUID.randomUUID() + extension(file.getOriginalFilename());
        Path target = resolveUnderRoot(key);
        Files.createDirectories(target.getParent());
        Path temporary = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
        try {
            try (var input = file.getInputStream()) {
                Files.copy(input, temporary, StandardCopyOption.REPLACE_EXISTING);
            }
            moveIntoPlace(temporary, target);
            return new StoredFile(key, "/files/" + key);
        } catch (IOException failure) {
            try {
                Files.deleteIfExists(temporary);
            } catch (IOException cleanupFailure) {
                failure.addSuppressed(cleanupFailure);
            }
            throw failure;
        }
    }

    @Override
    public Resource load(String storageKey) throws IOException {
        Path target = resolveUnderRoot(storageKey);
        if (!Files.isRegularFile(target)) throw new IOException("File not found");
        return new UrlResource(target.toUri());
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(resolveUnderRoot(storageKey));
    }

    private Path resolveUnderRoot(String storageKey) throws IOException {
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) throw new IOException("Invalid storage path");
        return target;
    }

    private void moveIntoPlace(Path temporary, Path target) throws IOException {
        try {
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException ignored) {
            Files.move(temporary, target);
        }
    }

    private String extension(String name) {
        if (name == null) return ".jpg";
        int dot = name.lastIndexOf('.');
        return dot >= 0 && dot < name.length() - 1 ? name.substring(dot).toLowerCase() : ".jpg";
    }
}
