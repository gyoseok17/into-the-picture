package com.intothepicture.domain.userphoto.dto;

import java.util.List;

/** Canonical labels and codes for the illustrated album-map location picker. */
public record MapLocationOptionDto(String code, String label, List<MapCityOptionDto> cities) {
    /** Map anchor used when a photo has a manually selected city/county. */
    public record MapCityOptionDto(String code, String label, double latitude, double longitude) { }
}
