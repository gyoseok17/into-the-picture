package com.intothepicture.domain.userphoto.dto;

/** Selects a user's own photo record as the representative for its map location. */
public record SetMapLocationRepresentativeRequest(Long photoRecordId) { }
