package com.intothepicture.domain.userphoto.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfiguration {
    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
    FileStorage localFileStorage(StorageProperties properties) {
        return new LocalFileStorage(properties.getLocalDir());
    }

    @Bean(destroyMethod = "close")
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
    S3Client photoS3Client(StorageProperties properties) {
        properties.requireS3Configuration();
        // DefaultCredentialsProvider is selected by the SDK automatically:
        // local AWS CLI credentials on a workstation and the EC2 IAM role in AWS.
        return S3Client.builder().region(Region.of(properties.getS3().getRegion())).build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
    FileStorage s3FileStorage(S3Client photoS3Client, StorageProperties properties) {
        properties.requireS3Configuration();
        return new S3FileStorage(photoS3Client, properties.getS3().getBucket());
    }
}
