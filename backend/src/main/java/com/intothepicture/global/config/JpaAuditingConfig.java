package com.intothepicture.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** BaseTimeEntity 의 createdAt/updatedAt 자동 채움(JPA Auditing) 활성화. */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
