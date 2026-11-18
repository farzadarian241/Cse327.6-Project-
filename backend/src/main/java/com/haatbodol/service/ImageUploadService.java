package com.haatbodol.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Handles validation, resizing (max width 1000px without upscaling), JPEG compression
 * via Thumbnailator, WebP fallback persistence, and photographic category fallbacks
 * for listing images served by Next.js under {@code /uploads/listings/}.
 */
@Service
public class ImageUploadService {

    public static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public static final int MAX_IMAGES_PER_LISTING = 5;
    public static final int MAX_IMAGE_WIDTH = 1000;
    public static final double IMAGE_QUALITY = 0.80;

    private static final String ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Path uploadDirectory;

    public ImageUploadService(
            @Value("${haatbodol.upload.dir:../public/uploads/listings}") String configuredUploadDir
    ) {
        this.uploadDirectory = resolveUploadDirectory(configuredUploadDir);
    }

    /**
     * Resolves the upload directory safely whether Spring Boot is launched from
     * {@code backend/} or the repository root.
     */
    private static Path resolveUploadDirectory(String configuredDir) {
        if (configuredDir != null && !configuredDir.isBlank()) {
            Path configuredPath = Paths.get(configuredDir);
            if (configuredPath.isAbsolute()) {
                return configuredPath.normalize();
            }
            // If using the default relative path and JVM was launched from repo root (where ./public exists)
            if ("../public/uploads/listings".equals(configuredDir.trim())) {
                Path rootPublic = Paths.get("public").toAbsolutePath().normalize();
                Path parentPublic = Paths.get("..", "public").toAbsolutePath().normalize();
                if (Files.isDirectory(rootPublic) && !Files.isDirectory(parentPublic)) {
                    return rootPublic.resolve("uploads").resolve("listings").normalize();
                }
            }
            return configuredPath.toAbsolutePath().normalize();
        }
        return Paths.get("..", "public", "uploads", "listings").toAbsolutePath().normalize();
    }

    /**
     * Returns the resolved filesystem directory where listing images are stored.
     */
    public Path getUploadDirectory() {
        return uploadDirectory;
    }

    /**
     * Ensures the target upload directory exists on disk.
     */
    public void ensureUploadDir() throws IOException {
        if (!Files.exists(uploadDirectory)) {
            Files.createDirectories(uploadDirectory);
        }
    }

    /**
     * Validates MIME type against JPEG, PNG, and WebP.
     */
    public boolean isValidImageMimeType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return false;
        }
        return ALLOWED_MIME_TYPES.contains(mimeType.trim().toLowerCase(Locale.ROOT));
    }

    /**
     * Returns photographic category fallback URL when a listing has no uploaded photos.
     */
    public String getCategoryFallbackImage(String category) {
        String cat = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        if (cat.contains("furnit") || cat.contains("desk") || cat.contains("chair")) {
            return "/uploads/defaults/study-desk.jpg";
        }
        if (cat.contains("cloth") || cat.contains("jacket") || cat.contains("wear") || cat.contains("apparel")) {
            return "/uploads/defaults/winter-jacket.jpg";
        }
        return "/uploads/defaults/laptop.jpg";
    }

    /**
     * Validates, compresses, and persists up to 5 uploaded image files.
     *
     * @param files  list of uploaded multipart files
     * @param prefix filename prefix (e.g., {@code seller_2})
     * @return list of public URL paths (e.g., {@code /uploads/listings/...})
     */
    public List<String> processAndSaveImages(List<MultipartFile> files, String prefix) throws IOException {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }

        List<MultipartFile> nonEmpty = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                nonEmpty.add(file);
            }
        }

        if (nonEmpty.isEmpty()) {
            return new ArrayList<>();
        }

        if (nonEmpty.size() > MAX_IMAGES_PER_LISTING) {
            throw new IllegalArgumentException(
                    "A maximum of " + MAX_IMAGES_PER_LISTING
                            + " images can be uploaded per listing (received " + nonEmpty.size() + ")."
            );
        }

        // Pre-validate all MIME types before persisting any files
        for (int i = 0; i < nonEmpty.size(); i++) {
            MultipartFile file = nonEmpty.get(i);
            String mime = resolveEffectiveMimeType(file);
            if (!isValidImageMimeType(mime)) {
                throw new IllegalArgumentException(
                        "File #" + (i + 1) + " has unsupported format \"" + mime
                                + "\". Allowed formats: JPEG, PNG, WebP."
                );
            }
        }

        ensureUploadDir();
        String safePrefix = (prefix == null || prefix.isBlank()) ? "listing" : prefix.replaceAll("[^a-zA-Z0-9_-]", "_");

        List<String> savedUrls = new ArrayList<>();
        for (int i = 0; i < nonEmpty.size(); i++) {
            String url = processAndSaveSingleImage(nonEmpty.get(i), safePrefix, i + 1);
            savedUrls.add(url);
        }
        return savedUrls;
    }

    /**
     * Resizes (without upscaling beyond 1000px width) and compresses a single image.
     * JPEG/PNG images are saved as {@code .jpg} at 80% quality via Thumbnailator.
     * WebP images are converted via Thumbnailator when ImageIO supports WebP, or stored
     * directly as {@code .webp} bytes otherwise.
     */
    public String processAndSaveSingleImage(MultipartFile file, String prefix, int index) throws IOException {
        ensureUploadDir();

        String mime = resolveEffectiveMimeType(file);
        if (!isValidImageMimeType(mime)) {
            throw new IllegalArgumentException(
                    "Unsupported image MIME type \"" + mime + "\". Allowed types: JPEG, PNG, WebP."
            );
        }

        byte[] rawBytes = file.getBytes();
        if (rawBytes.length == 0) {
            throw new IllegalArgumentException("Uploaded image file is empty.");
        }

        long timestamp = System.currentTimeMillis();
        String randomSuffix = randomAlphanumeric(7);
        String baseName = prefix + "_" + timestamp + "_" + randomSuffix + "_" + index;

        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(rawBytes));
        if (decoded != null) {
            // Ensure opaque RGB image so PNGs with alpha channels compress cleanly to JPEG
            BufferedImage rgbImage = toOpaqueRgb(decoded);
            String filename = baseName + ".jpg";
            Path destination = uploadDirectory.resolve(filename);

            Thumbnails.Builder<BufferedImage> builder = Thumbnails.of(rgbImage);
            if (rgbImage.getWidth() > MAX_IMAGE_WIDTH) {
                builder.width(MAX_IMAGE_WIDTH).keepAspectRatio(true);
            } else {
                builder.scale(1.0);
            }
            builder.outputFormat("jpg")
                    .outputQuality(IMAGE_QUALITY)
                    .toFile(destination.toFile());

            return "/uploads/listings/" + filename;
        }

        // Standard JDK ImageIO lacks a built-in WebP reader — persist valid WebP bytes directly
        if ("image/webp".equalsIgnoreCase(mime) || isWebpMagicHeader(rawBytes)) {
            String filename = baseName + ".webp";
            Path destination = uploadDirectory.resolve(filename);
            Files.write(destination, rawBytes);
            return "/uploads/listings/" + filename;
        }

        throw new IllegalArgumentException(
                "Unable to decode uploaded image file. Please upload a valid JPEG, PNG, or WebP image."
        );
    }

    private static BufferedImage toOpaqueRgb(BufferedImage source) {
        if (source.getType() == BufferedImage.TYPE_INT_RGB && !source.getColorModel().hasAlpha()) {
            return source;
        }
        BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = rgb.createGraphics();
        try {
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, source.getWidth(), source.getHeight());
            g2d.drawImage(source, 0, 0, null);
        } finally {
            g2d.dispose();
        }
        return rgb;
    }

    private static String resolveEffectiveMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()
                && !"application/octet-stream".equalsIgnoreCase(contentType.trim())) {
            int semicolon = contentType.indexOf(';');
            return (semicolon >= 0 ? contentType.substring(0, semicolon) : contentType).trim().toLowerCase(Locale.ROOT);
        }
        String originalName = file.getOriginalFilename();
        if (originalName != null) {
            String lower = originalName.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                return "image/jpeg";
            }
            if (lower.endsWith(".png")) {
                return "image/png";
            }
            if (lower.endsWith(".webp")) {
                return "image/webp";
            }
        }
        return contentType != null ? contentType.trim().toLowerCase(Locale.ROOT) : "";
    }

    private static boolean isWebpMagicHeader(byte[] bytes) {
        return bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
    }

    private static String randomAlphanumeric(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}
