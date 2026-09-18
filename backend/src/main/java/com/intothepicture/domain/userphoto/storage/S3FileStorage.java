package com.intothepicture.domain.userphoto.storage;

import java.io.IOException;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * Private object storage adapter. It deliberately returns the existing API URL
 * rather than an S3 URL, so the application keeps server-side authorization.
 */
public class S3FileStorage implements FileStorage {
    private final S3Client s3;
    private final String bucket;

    public S3FileStorage(S3Client s3, String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    @Override
    public StoredFile store(Long userId, MultipartFile file) throws IOException {
        String key = UserPhotoStorageKey.create(userId, file.getOriginalFilename());
        PutObjectRequest.Builder request = PutObjectRequest.builder().bucket(bucket).key(key);
        if (file.getContentType() != null) request.contentType(file.getContentType());
        try (var input = file.getInputStream()) {
            s3.putObject(request.build(), RequestBody.fromInputStream(input, file.getSize()));
            return new StoredFile(key, "/files/" + key);
        } catch (SdkException failure) {
            throw new IOException("Failed to store the photo in object storage.", failure);
        }
    }

    @Override
    public Resource load(String storageKey) throws IOException {
        validateStorageKey(storageKey);
        try {
            var stream = s3.getObject(GetObjectRequest.builder().bucket(bucket).key(storageKey).build(),
                ResponseTransformer.toInputStream());
            return new InputStreamResource(stream);
        } catch (SdkException failure) {
            throw new IOException("Failed to load the photo from object storage.", failure);
        }
    }

    @Override
    public void delete(String storageKey) throws IOException {
        validateStorageKey(storageKey);
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(storageKey).build());
        } catch (SdkException failure) {
            throw new IOException("Failed to delete the photo from object storage.", failure);
        }
    }

    private void validateStorageKey(String storageKey) throws IOException {
        if (storageKey == null || !storageKey.startsWith("u/") || storageKey.contains("..") || storageKey.contains("\\")) {
            throw new IOException("Invalid storage path");
        }
    }
}
