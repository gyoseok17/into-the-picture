package com.intothepicture.domain.comparison.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;

/** Display-only crop metadata for one contest comparison; it never changes the uploaded file. */
@Getter
@Embeddable
public class ComparisonCrop {
    public static final double DEFAULT_TARGET_ASPECT_RATIO = 4d / 3d;
    public static final double DEFAULT_ZOOM = 1d;
    public static final double DEFAULT_POSITION = 0d;

    @Column(name = "comparison_target_aspect_ratio", nullable = false)
    private Double targetAspectRatio = DEFAULT_TARGET_ASPECT_RATIO;

    @Column(name = "comparison_crop_zoom", nullable = false)
    private Double zoom = DEFAULT_ZOOM;

    @Column(name = "comparison_crop_position_x", nullable = false)
    private Double positionX = DEFAULT_POSITION;

    @Column(name = "comparison_crop_position_y", nullable = false)
    private Double positionY = DEFAULT_POSITION;

    public ComparisonCrop() { }

    public ComparisonCrop(double targetAspectRatio, double zoom, double positionX, double positionY) {
        change(targetAspectRatio, zoom, positionX, positionY);
    }

    public void change(double targetAspectRatio, double zoom, double positionX, double positionY) {
        this.targetAspectRatio = targetAspectRatio;
        this.zoom = zoom;
        this.positionX = positionX;
        this.positionY = positionY;
    }

    /** A replaced image keeps the contest frame but starts from a neutral, uncropped position. */
    public void resetForReplacement() {
        this.zoom = DEFAULT_ZOOM;
        this.positionX = DEFAULT_POSITION;
        this.positionY = DEFAULT_POSITION;
    }
}
