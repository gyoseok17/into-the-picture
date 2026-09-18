package com.intothepicture.domain.userphoto.storage;

import java.util.UUID;
import java.util.Locale;

/** Stable object-key rule shared by every user photo storage adapter. */
final class UserPhotoStorageKey {
    private UserPhotoStorageKey() { }

    static String create(Long userId, String originalFilename) {
        return "u/" + userId + "/" + UUID.randomUUID() + extension(originalFilename);
    }

    private static String extension(String name) {
        if (name == null) return ".jpg";
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return ".jpg";
        String suffix = name.substring(dot + 1).toLowerCase(Locale.ROOT);
        return suffix.matches("[a-z0-9]{1,10}") ? "." + suffix : ".jpg";
    }
}
