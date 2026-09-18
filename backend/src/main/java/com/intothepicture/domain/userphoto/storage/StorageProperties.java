package com.intothepicture.domain.userphoto.storage;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration shared by the selectable local and S3 storage adapters. */
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {
    private String type = "local";
    private String localDir = "./uploads";
    private final S3 s3 = new S3();

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLocalDir() { return localDir; }
    public void setLocalDir(String localDir) { this.localDir = localDir; }
    public S3 getS3() { return s3; }

    @PostConstruct
    void validateType() {
        if (!"local".equals(type) && !"s3".equals(type)) {
            throw new IllegalStateException("APP_STORAGE_TYPE must be either 'local' or 's3'.");
        }
    }

    public void requireS3Configuration() {
        if (s3.region == null || s3.region.isBlank()) {
            throw new IllegalStateException("AWS_REGION is required when APP_STORAGE_TYPE=s3.");
        }
        if (s3.bucket == null || s3.bucket.isBlank()) {
            throw new IllegalStateException("APP_STORAGE_S3_BUCKET is required when APP_STORAGE_TYPE=s3.");
        }
    }

    public static class S3 {
        private String region;
        private String bucket;

        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
        public String getBucket() { return bucket; }
        public void setBucket(String bucket) { this.bucket = bucket; }
    }
}
