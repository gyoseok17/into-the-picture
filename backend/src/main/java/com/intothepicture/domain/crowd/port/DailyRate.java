package com.intothepicture.domain.crowd.port;

import java.time.LocalDate;

/** 특정 날짜의 집중률(%). */
public record DailyRate(LocalDate date, double rate) {
}
