package com.haatbodol.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.haatbodol.model.DepreciationEstimate;
import com.haatbodol.model.ListingDto;
import com.haatbodol.patterns.builder.BuiltSqlQuery;
import com.haatbodol.patterns.builder.ListingQueryBuilder;
import com.haatbodol.patterns.decorator.ListingDecoratorPipeline;
import com.haatbodol.patterns.proxy.ListingAccessException;
import com.haatbodol.patterns.proxy.ListingAccessService;
import com.haatbodol.patterns.singleton.DatabasePool;
import com.haatbodol.patterns.strategy.DepreciationContext;
import com.haatbodol.security.AuthenticatedUser;
import com.haatbodol.security.JwtService;
import com.haatbodol.service.ImageUploadService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * REST Controller for product listings:
 * <ul>
 *   <li>{@code POST /api/listings/estimate-price} — Pattern 2 Strategy fair resale valuation</li>
 *   <li>{@code GET /api/listings} — Pattern 6 Builder dynamic SQL + Pattern 8 Decorator pipeline</li>
 *   <li>{@code GET /api/listings/{id}} — Pattern 7 Protection Proxy contact masking &amp; visibility gate</li>
 *   <li>{@code PATCH /api/listings/{id}} — Pattern 7 Protection Proxy owner/admin update</li>
 *   <li>{@code DELETE /api/listings/{id}} — Pattern 7 Protection Proxy owner/admin deletion</li>
 *   <li>{@code POST /api/listings/{id}/report} — Authenticated moderation report submission</li>
 *   <li>{@code POST /api/listings} — Authenticated multipart/JSON listing creation with atomic JDBC transaction</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private static final List<String> ALLOWED_CATEGORIES = List.of(
            "Electronic Devices",
            "Furniture",
            "Clothing"
    );

    private static final List<String> ALLOWED_CONDITIONS = List.of(
            "Like New",
            "Good",
            "Fair",
            "Needs Repair"
    );

    private final JwtService jwtService;
    private final ImageUploadService imageUploadService;
    private final ObjectMapper objectMapper;
    private final ListingAccessService listingAccessProxy;

    public ListingController(
            JwtService jwtService,
            ImageUploadService imageUploadService,
            ObjectMapper objectMapper,
            @Qualifier("listingAccessProxy") ListingAccessService listingAccessProxy
    ) {
        this.jwtService = jwtService;
        this.imageUploadService = imageUploadService;
        this.objectMapper = objectMapper;
        this.listingAccessProxy = listingAccessProxy;
    }

    /**
     * POST /api/listings/estimate-price
     * Validates inputs and computes fair resale price range using the Java Strategy Pattern.
     */
    @PostMapping("/estimate-price")
    public ResponseEntity<Map<String, Object>> estimatePrice(HttpServletRequest request) {
        Map<String, Object> body;
        try {
            body = readJsonBody(request);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request body.");
        }
        if (body == null) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Request body must be a valid JSON object.");
        }

        Object rawCategory = body.get("category");
        if (!(rawCategory instanceof String catStr) || catStr.isBlank()) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Category is required. Allowed values: Electronic Devices, Furniture, Clothing.");
        }

        String matchedCategory = matchAllowed(ALLOWED_CATEGORIES, catStr);
        if (matchedCategory == null) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Invalid category \"" + catStr + "\". Allowed categories: "
                            + String.join(", ", ALLOWED_CATEGORIES) + ".");
        }

        Double originalPrice = parseDouble(body.get("originalPrice"));
        if (originalPrice == null || originalPrice <= 0.0 || originalPrice.isNaN() || originalPrice.isInfinite()) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Original price must be a valid positive number greater than 0.");
        }

        Integer ageInMonths = parseInteger(body.get("ageInMonths"));
        if (ageInMonths == null || ageInMonths < 0) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Age in months must be a non-negative integer (>= 0).");
        }

        Object rawCondition = body.get("condition");
        if (!(rawCondition instanceof String condStr) || condStr.isBlank()) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Condition is required. Allowed values: Like New, Good, Fair, Needs Repair.");
        }

        String matchedCondition = matchAllowed(ALLOWED_CONDITIONS, condStr);
        if (matchedCondition == null) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Invalid condition \"" + condStr + "\". Allowed conditions: "
                            + String.join(", ", ALLOWED_CONDITIONS) + ".");
        }

        try {
            DepreciationContext context = new DepreciationContext();
            DepreciationEstimate estimate = context.calculate(
                    matchedCategory,
                    originalPrice,
                    ageInMonths,
                    matchedCondition
            );

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("category", estimate.getCategory());
            resp.put("originalPrice", estimate.getOriginalPrice());
            resp.put("ageInMonths", estimate.getAgeInMonths());
            resp.put("condition", estimate.getCondition());
            resp.put("suggestedMin", estimate.getSuggestedMin());
            resp.put("suggestedMax", estimate.getSuggestedMax());
            resp.put("baselinePrice", estimate.getBaselinePrice());
            resp.put("depreciationPercentage", estimate.getDepreciationPercentage());
            resp.put("explanation", estimate.getExplanation());
            resp.put("data", estimate);

            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An unexpected internal error occurred while calculating depreciation.");
        }
    }

    /**
     * GET /api/listings
     * Uses the Pattern 6 {@link ListingQueryBuilder} for dynamic parameterized SQL filtering,
     * sorting, and pagination, then enriches every listing through {@link ListingDecoratorPipeline}.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getListings(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "minPrice", required = false) String minPriceParam,
            @RequestParam(name = "min_price", required = false) String minPriceSnake,
            @RequestParam(name = "maxPrice", required = false) String maxPriceParam,
            @RequestParam(name = "max_price", required = false) String maxPriceSnake,
            @RequestParam(name = "condition", required = false) String condition,
            @RequestParam(name = "item_condition", required = false) String itemCondition,
            @RequestParam(name = "location", required = false) String location,
            @RequestParam(name = "autodrop", required = false) String autoDropParam,
            @RequestParam(name = "autoDrop", required = false) String autoDropCamel,
            @RequestParam(name = "verified", required = false) String verifiedParam,
            @RequestParam(name = "sort", required = false, defaultValue = "newest") String sort,
            @RequestParam(name = "page", required = false, defaultValue = "1") String pageParam,
            @RequestParam(name = "limit", required = false, defaultValue = "24") String limitParam
    ) {
        String effectiveKeyword = (q != null && !q.isBlank()) ? q : search;
        String effectiveCondition = (condition != null && !condition.isBlank()) ? condition : itemCondition;
        Double minPrice = parseDouble((minPriceParam != null && !minPriceParam.isBlank()) ? minPriceParam : minPriceSnake);
        Double maxPrice = parseDouble((maxPriceParam != null && !maxPriceParam.isBlank()) ? maxPriceParam : maxPriceSnake);
        boolean autoDropOnly = parseBoolean(
                (autoDropParam != null && !autoDropParam.isBlank()) ? autoDropParam : autoDropCamel,
                false
        );
        boolean verifiedOnly = parseBoolean(verifiedParam, false);
        Integer page = parseInteger(pageParam);
        Integer limit = parseInteger(limitParam);

        BuiltSqlQuery builtQuery = new ListingQueryBuilder()
                .withKeyword(effectiveKeyword)
                .withCategory(category)
                .withMinPrice(minPrice)
                .withMaxPrice(maxPrice)
                .withCondition(effectiveCondition)
                .withLocation(location)
                .withAutoDropOnly(autoDropOnly)
                .withVerifiedOnly(verifiedOnly)
                .withSort(sort)
                .withPage(page)
                .withLimit(limit)
                .build();

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            long total = 0L;
            try (PreparedStatement countPs = conn.prepareStatement(builtQuery.getCountSql())) {
                bindParameters(countPs, builtQuery.getParameters());
                try (ResultSet countRs = countPs.executeQuery()) {
                    if (countRs.next()) {
                        total = countRs.getLong("total");
                    }
                }
            }

            List<ListingDto> dtos = new ArrayList<>();
            try (PreparedStatement dataPs = conn.prepareStatement(builtQuery.getDataSql())) {
                bindParameters(dataPs, builtQuery.getDataParameters());
                try (ResultSet rs = dataPs.executeQuery()) {
                    while (rs.next()) {
                        dtos.add(mapListingRow(rs));
                    }
                }
            }

            List<Map<String, Object>> decoratedListings = ListingDecoratorPipeline.decorateAll(dtos);
            int totalPages = total == 0L ? 0 : (int) Math.ceil((double) total / builtQuery.getLimit());

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("count", decoratedListings.size());
            resp.put("total", total);
            resp.put("page", builtQuery.getPage());
            resp.put("limit", builtQuery.getLimit());
            resp.put("totalPages", totalPages);
            resp.put("listings", decoratedListings);
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve listings.");
        }
    }

    /**
     * GET /api/listings/{id}
     * Delegates to {@link com.haatbodol.patterns.proxy.ListingAccessProxy} so seller contact
     * details are masked or unlocked according to the Protection Proxy policy.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getListingById(
            @PathVariable("id") long listingId,
            HttpServletRequest request
    ) {
        AuthenticatedUser requester = jwtService.extractAuthenticatedUser(request);
        Map<String, Object> listing = listingAccessProxy.getListingDetail(listingId, requester);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("listing", listing);
        return ResponseEntity.ok(resp);
    }

    /**
     * PATCH /api/listings/{id}
     * Delegates owner/admin authorization and field updates to {@link com.haatbodol.patterns.proxy.ListingAccessProxy}.
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateListing(
            @PathVariable("id") long listingId,
            HttpServletRequest request
    ) {
        AuthenticatedUser requester = jwtService.extractAuthenticatedUser(request);
        if (requester == null) {
            // Invoke proxy so 401 policy is consistently enforced through ListingAccessProxy
            listingAccessProxy.updateListing(listingId, Map.of(), null);
        }

        Map<String, Object> body;
        try {
            body = readJsonBody(request);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request body.");
        }
        if (body == null || body.isEmpty()) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Request body must contain fields to update.");
        }

        Map<String, Object> updatedListing = listingAccessProxy.updateListing(listingId, body, requester);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Listing updated successfully.");
        resp.put("listing", updatedListing);
        return ResponseEntity.ok(resp);
    }

    /**
     * DELETE /api/listings/{id}
     * Delegates owner/admin authorization and deletion to {@link com.haatbodol.patterns.proxy.ListingAccessProxy}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteListing(
            @PathVariable("id") long listingId,
            HttpServletRequest request
    ) {
        AuthenticatedUser requester = jwtService.extractAuthenticatedUser(request);
        listingAccessProxy.deleteListing(listingId, requester);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Listing deleted successfully.");
        return ResponseEntity.ok(resp);
    }

    /**
     * POST /api/listings/{id}/report
     * Authenticated endpoint inserting a user moderation report into {@code moderation_reports}.
     */
    @PostMapping("/{id}/report")
    public ResponseEntity<Map<String, Object>> reportListing(
            @PathVariable("id") long listingId,
            HttpServletRequest request
    ) {
        AuthenticatedUser requester = jwtService.extractAuthenticatedUser(request);
        if (requester == null) {
            return errorResponse(HttpStatus.UNAUTHORIZED, "Authentication required. Please sign in to report a listing.");
        }

        Map<String, Object> body;
        try {
            body = readJsonBody(request);
        } catch (IOException ex) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON request body.");
        }
        if (body == null) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Report reason is required.");
        }

        String reason = firstNonBlank(body, "reason");
        String details = firstNonBlank(body, "details");

        if (reason.length() < 3) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Please provide a reason for reporting this listing.");
        }
        if (reason.length() > 120) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Report reason cannot exceed 120 characters.");
        }

        try (Connection conn = DatabasePool.getInstance().getConnection()) {
            try (PreparedStatement checkPs = conn.prepareStatement(
                    "SELECT listing_id FROM product_listings WHERE listing_id = ? LIMIT 1")) {
                checkPs.setLong(1, listingId);
                try (ResultSet rs = checkPs.executeQuery()) {
                    if (!rs.next()) {
                        return errorResponse(HttpStatus.NOT_FOUND, "Listing not found.");
                    }
                }
            }

            long reportId;
            String insertSql = """
                    INSERT INTO moderation_reports (
                        listing_id, reporter_id, reason, details, report_status, created_at
                    ) VALUES (?, ?, ?, ?, 'OPEN', NOW())
                    """;
            try (PreparedStatement insertPs = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                insertPs.setLong(1, listingId);
                insertPs.setLong(2, requester.getUserId());
                insertPs.setString(3, reason);
                if (!details.isEmpty()) {
                    insertPs.setString(4, details);
                } else {
                    insertPs.setNull(4, Types.VARCHAR);
                }
                insertPs.executeUpdate();
                try (ResultSet keys = insertPs.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException("Failed to retrieve generated report_id.");
                    }
                    reportId = keys.getLong(1);
                }
            }

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("report_id", reportId);
            resp.put("message", "Thank you. Your report has been submitted for admin moderation.");
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception ex) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to submit moderation report.");
        }
    }

    @ExceptionHandler(ListingAccessException.class)
    public ResponseEntity<Map<String, Object>> handleListingAccessException(ListingAccessException ex) {
        return errorResponse(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return errorResponse(HttpStatus.BAD_REQUEST, "Invalid listing identifier.");
    }

    private static void bindParameters(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object param = params.get(i);
            int idx = i + 1;
            if (param instanceof Integer intVal) {
                ps.setInt(idx, intVal);
            } else if (param instanceof Long longVal) {
                ps.setLong(idx, longVal);
            } else if (param instanceof Double doubleVal) {
                ps.setDouble(idx, doubleVal);
            } else if (param instanceof Boolean boolVal) {
                ps.setBoolean(idx, boolVal);
            } else if (param == null) {
                ps.setNull(idx, Types.NULL);
            } else {
                ps.setString(idx, String.valueOf(param));
            }
        }
    }

    /**
     * POST /api/listings
     * Supports BOTH {@code multipart/form-data} (from {@code /listings/new}) AND
     * {@code application/json} (for API clients). Enforces JWT authentication, field and
     * Auto-Drop validation, Strategy depreciation calculation, Thumbnailator image saving,
     * and an atomic JDBC transaction.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createListing(HttpServletRequest request) {
        // 1. Verify authenticated JWT session
        Map<String, Object> session = jwtService.extractSessionFromRequest(request);
        if (session == null || session.get("user_id") == null) {
            return errorResponse(HttpStatus.UNAUTHORIZED, "Unauthorized. Please sign in to create a listing.");
        }
        long sellerId = ((Number) session.get("user_id")).longValue();

        // 2. Parse multipart/form-data OR application/json
        String title;
        String description;
        String category;
        Object originalPriceRaw;
        Object ageInMonthsRaw;
        String itemConditionRaw;
        Object currentAskingPriceRaw;
        String pickupLocation;
        Object isNegotiableRaw;
        Object autoDropEnabledRaw;
        Object minReservePriceRaw;
        List<MultipartFile> uploadedImageFiles = new ArrayList<>();
        List<String> passedImageUrls = new ArrayList<>();

        String contentType = request.getContentType() != null ? request.getContentType().toLowerCase(Locale.ROOT) : "";
        if (request instanceof MultipartHttpServletRequest multipartRequest
                || contentType.contains("multipart/form-data")) {

            if (!(request instanceof MultipartHttpServletRequest multipartReq)) {
                return errorResponse(HttpStatus.BAD_REQUEST, "Malformed multipart/form-data request.");
            }

            title = firstParam(multipartReq, "title");
            description = firstParam(multipartReq, "description");
            category = firstParam(multipartReq, "category");
            originalPriceRaw = firstParamOrNull(multipartReq, "original_price", "originalPrice");
            ageInMonthsRaw = firstParamOrNull(multipartReq, "age_in_months", "ageInMonths");
            itemConditionRaw = firstParam(multipartReq, "item_condition", "itemCondition", "condition");
            currentAskingPriceRaw = firstParamOrNull(multipartReq,
                    "current_asking_price", "currentAskingPrice", "asking_price", "askingPrice");
            pickupLocation = firstParam(multipartReq, "pickup_location", "pickupLocation");
            isNegotiableRaw = firstParamOrNull(multipartReq, "is_negotiable", "isNegotiable");
            autoDropEnabledRaw = firstParamOrNull(multipartReq, "auto_drop_enabled", "autoDropEnabled");
            minReservePriceRaw = firstParamOrNull(multipartReq, "min_reserve_price", "minReservePrice");

            // Extract uploaded files from any key containing image/photo/file
            MultiValueMap<String, MultipartFile> fileMap = multipartReq.getMultiFileMap();
            for (Map.Entry<String, List<MultipartFile>> entry : fileMap.entrySet()) {
                String keyLower = entry.getKey().toLowerCase(Locale.ROOT);
                if (keyLower.contains("image") || keyLower.contains("photo") || keyLower.contains("file")) {
                    for (MultipartFile mf : entry.getValue()) {
                        if (mf != null && !mf.isEmpty() && mf.getSize() > 0) {
                            uploadedImageFiles.add(mf);
                        }
                    }
                }
            }
        } else {
            Map<String, Object> body;
            try {
                body = readJsonBody(request);
            } catch (IOException ex) {
                return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON body provided.");
            }
            if (body == null) {
                return errorResponse(HttpStatus.BAD_REQUEST, "Invalid JSON body provided.");
            }

            title = firstNonBlank(body, "title");
            description = firstNonBlank(body, "description");
            category = firstNonBlank(body, "category");
            originalPriceRaw = firstValue(body, "original_price", "originalPrice");
            ageInMonthsRaw = firstValue(body, "age_in_months", "ageInMonths");
            itemConditionRaw = firstNonBlank(body, "item_condition", "itemCondition", "condition");
            currentAskingPriceRaw = firstValue(body,
                    "current_asking_price", "currentAskingPrice", "asking_price", "askingPrice");
            pickupLocation = firstNonBlank(body, "pickup_location", "pickupLocation");
            isNegotiableRaw = firstValue(body, "is_negotiable", "isNegotiable");
            autoDropEnabledRaw = firstValue(body, "auto_drop_enabled", "autoDropEnabled");
            minReservePriceRaw = firstValue(body, "min_reserve_price", "minReservePrice");

            Object imagesObj = body.get("images");
            if (imagesObj instanceof List<?> list) {
                for (Object item : list) {
                    if (item instanceof String s && !s.isBlank()) {
                        passedImageUrls.add(s.trim());
                    }
                }
            } else if (body.get("image") instanceof String imgStr && !imgStr.isBlank()) {
                passedImageUrls.add(imgStr.trim());
            }
        }

        // 3. Field Validations
        if (title.length() < 3) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Title is required and must be at least 3 characters.");
        }
        if (title.length() > 180) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Title cannot exceed 180 characters.");
        }

        if (description.length() < 5) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Description is required and must be at least 5 characters.");
        }

        String matchedCategory = matchAllowed(ALLOWED_CATEGORIES, category);
        if (matchedCategory == null) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Invalid category \"" + category + "\". Allowed categories: "
                            + String.join(", ", ALLOWED_CATEGORIES) + ".");
        }

        Double originalPrice = parseDouble(originalPriceRaw);
        if (originalPrice == null || originalPrice <= 0.0 || originalPrice.isNaN() || originalPrice.isInfinite()) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Original purchase price must be a valid number greater than 0.");
        }

        Integer ageInMonths = parseInteger(ageInMonthsRaw);
        if (ageInMonths == null || ageInMonths < 0) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Age in months must be a non-negative integer (>= 0).");
        }

        String matchedCondition = matchAllowed(ALLOWED_CONDITIONS, itemConditionRaw);
        if (matchedCondition == null) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Invalid condition \"" + itemConditionRaw + "\". Allowed conditions: "
                            + String.join(", ", ALLOWED_CONDITIONS) + ".");
        }

        Double currentAskingPrice = parseDouble(currentAskingPriceRaw);
        if (currentAskingPrice == null || currentAskingPrice <= 0.0
                || currentAskingPrice.isNaN() || currentAskingPrice.isInfinite()) {
            return errorResponse(HttpStatus.BAD_REQUEST,
                    "Current asking price must be a valid number greater than 0.");
        }

        if (pickupLocation.length() < 2) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Pickup location is required.");
        }
        if (pickupLocation.length() > 150) {
            return errorResponse(HttpStatus.BAD_REQUEST, "Pickup location cannot exceed 150 characters.");
        }

        boolean isNegotiable = parseBoolean(isNegotiableRaw, true);
        boolean autoDropEnabled = parseBoolean(autoDropEnabledRaw, false);

        Double minReservePrice = null;
        if (autoDropEnabled) {
            minReservePrice = parseDouble(minReservePriceRaw);
            if (minReservePrice == null || minReservePrice <= 0.0
                    || minReservePrice.isNaN() || minReservePrice.isInfinite()) {
                return errorResponse(HttpStatus.BAD_REQUEST,
                        "When Auto-Drop is enabled, minimum reserve price must be a positive number greater than 0.");
            }
            if (minReservePrice >= currentAskingPrice) {
                NumberFormat nf = NumberFormat.getNumberInstance(Locale.US);
                return errorResponse(HttpStatus.BAD_REQUEST,
                        "Minimum reserve price (৳" + nf.format(minReservePrice)
                                + ") must be strictly lower than the current asking price (৳"
                                + nf.format(currentAskingPrice) + ").");
            }
        }

        // 4. Calculate Suggested Resale Price Range using Java Strategy Pattern
        DepreciationContext depreciationContext = new DepreciationContext();
        DepreciationEstimate depreciationResult = depreciationContext.calculate(
                matchedCategory,
                originalPrice,
                ageInMonths,
                matchedCondition
        );
        double suggestedMinPrice = depreciationResult.getSuggestedMin();
        double suggestedMaxPrice = depreciationResult.getSuggestedMax();

        // 5. Process Images via ImageUploadService
        List<String> finalImageUrls;
        if (!uploadedImageFiles.isEmpty()) {
            if (uploadedImageFiles.size() > ImageUploadService.MAX_IMAGES_PER_LISTING) {
                return errorResponse(HttpStatus.BAD_REQUEST,
                        "A maximum of " + ImageUploadService.MAX_IMAGES_PER_LISTING
                                + " images can be uploaded per listing.");
            }
            try {
                finalImageUrls = imageUploadService.processAndSaveImages(uploadedImageFiles, "seller_" + sellerId);
            } catch (IllegalArgumentException ex) {
                return errorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
            } catch (IOException ex) {
                return errorResponse(HttpStatus.BAD_REQUEST,
                        "Image processing failed: " + ex.getMessage());
            }
        } else if (!passedImageUrls.isEmpty()) {
            int maxCount = Math.min(passedImageUrls.size(), ImageUploadService.MAX_IMAGES_PER_LISTING);
            finalImageUrls = new ArrayList<>(passedImageUrls.subList(0, maxCount));
        } else {
            finalImageUrls = List.of(imageUploadService.getCategoryFallbackImage(matchedCategory));
        }

        // 6. Atomic JDBC Transaction: product_listings + listing_images + auto_drop_configs + seller role
        Connection conn = null;
        try {
            conn = DatabasePool.getInstance().getConnection();
            conn.setAutoCommit(false);

            long listingId;
            String insertListingSql = """
                    INSERT INTO product_listings (
                        seller_id,
                        title,
                        description,
                        category,
                        original_price,
                        age_in_months,
                        item_condition,
                        suggested_min_price,
                        suggested_max_price,
                        current_asking_price,
                        pickup_location,
                        listing_status,
                        is_negotiable,
                        auto_drop_enabled,
                        published_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, NOW())
                    """;

            try (PreparedStatement ps = conn.prepareStatement(insertListingSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setLong(1, sellerId);
                ps.setString(2, title);
                ps.setString(3, description);
                ps.setString(4, matchedCategory);
                ps.setDouble(5, originalPrice);
                ps.setInt(6, ageInMonths);
                ps.setString(7, matchedCondition);
                ps.setDouble(8, suggestedMinPrice);
                ps.setDouble(9, suggestedMaxPrice);
                ps.setDouble(10, currentAskingPrice);
                ps.setString(11, pickupLocation);
                ps.setInt(12, isNegotiable ? 1 : 0);
                ps.setInt(13, autoDropEnabled ? 1 : 0);

                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException("Failed to retrieve generated listing_id.");
                    }
                    listingId = keys.getLong(1);
                }
            }

            // Insert listing images
            String insertImageSql = """
                    INSERT INTO listing_images (listing_id, image_url, display_order, is_compressed)
                    VALUES (?, ?, ?, 1)
                    """;
            try (PreparedStatement imgPs = conn.prepareStatement(insertImageSql)) {
                for (int i = 0; i < finalImageUrls.size(); i++) {
                    imgPs.setLong(1, listingId);
                    imgPs.setString(2, finalImageUrls.get(i));
                    imgPs.setInt(3, i + 1);
                    imgPs.executeUpdate();
                }
            }

            // If Auto-Drop is enabled, insert 7-day 5% Dutch auction config
            if (autoDropEnabled && minReservePrice != null) {
                String insertAutoDropSql = """
                        INSERT INTO auto_drop_configs (
                            listing_id,
                            min_reserve_price,
                            drop_percentage,
                            interval_hours,
                            next_drop_at,
                            is_halted
                        ) VALUES (?, ?, 5.00, 168, DATE_ADD(NOW(), INTERVAL 7 DAY), 0)
                        """;
                try (PreparedStatement dropPs = conn.prepareStatement(insertAutoDropSql)) {
                    dropPs.setLong(1, listingId);
                    dropPs.setDouble(2, minReservePrice);
                    dropPs.executeUpdate();
                }
            }

            // Ensure seller active_role is SELLER if previously BUYER
            try (PreparedStatement rolePs = conn.prepareStatement(
                    "UPDATE users SET active_role = 'SELLER' WHERE user_id = ? AND active_role = 'BUYER'")) {
                rolePs.setLong(1, sellerId);
                rolePs.executeUpdate();
            }

            conn.commit();

            Map<String, Object> listingPayload = new LinkedHashMap<>();
            listingPayload.put("listing_id", listingId);
            listingPayload.put("seller_id", sellerId);
            listingPayload.put("title", title);
            listingPayload.put("description", description);
            listingPayload.put("category", matchedCategory);
            listingPayload.put("original_price", originalPrice);
            listingPayload.put("age_in_months", ageInMonths);
            listingPayload.put("item_condition", matchedCondition);
            listingPayload.put("current_asking_price", currentAskingPrice);
            listingPayload.put("suggested_min_price", suggestedMinPrice);
            listingPayload.put("suggested_max_price", suggestedMaxPrice);
            listingPayload.put("pickup_location", pickupLocation);
            listingPayload.put("listing_status", "AVAILABLE");
            listingPayload.put("is_negotiable", isNegotiable);
            listingPayload.put("auto_drop_enabled", autoDropEnabled);
            listingPayload.put("min_reserve_price", autoDropEnabled ? minReservePrice : null);
            listingPayload.put("image_url", finalImageUrls.isEmpty() ? null : finalImageUrls.get(0));
            listingPayload.put("images", finalImageUrls);
            listingPayload.put("depreciation_explanation", depreciationResult.getExplanation());

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("message", "Listing published successfully.");
            resp.put("listingId", listingId);
            resp.put("listing_id", listingId);
            resp.put("listing", listingPayload);
            resp.put("data", listingPayload);

            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception ex) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ignored) {
                    // Best-effort rollback
                }
            }
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An unexpected internal error occurred while creating the listing.");
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                } catch (SQLException ignored) {
                    // Ignore
                }
                try {
                    conn.close();
                } catch (SQLException ignored) {
                    // Ignore
                }
            }
        }
    }

    private ListingDto mapListingRow(ResultSet rs) throws SQLException {
        ListingDto dto = new ListingDto();
        dto.setListingId(rs.getLong("listing_id"));
        dto.setSellerId(rs.getLong("seller_id"));
        dto.setTitle(rs.getString("title"));
        dto.setDescription(rs.getString("description"));
        dto.setCategory(rs.getString("category"));
        dto.setOriginalPrice(getNullableDouble(rs, "original_price"));
        dto.setAgeInMonths(rs.getInt("age_in_months"));
        dto.setItemCondition(rs.getString("item_condition"));
        dto.setSuggestedMinPrice(getNullableDouble(rs, "suggested_min_price"));
        dto.setSuggestedMaxPrice(getNullableDouble(rs, "suggested_max_price"));
        dto.setCurrentAskingPrice(getNullableDouble(rs, "current_asking_price"));
        dto.setPickupLocation(rs.getString("pickup_location"));
        dto.setListingStatus(rs.getString("listing_status"));
        dto.setIsNegotiable(rs.getInt("is_negotiable") == 1);
        dto.setAutoDropEnabled(rs.getInt("auto_drop_enabled") == 1);

        Timestamp publishedAt = rs.getTimestamp("published_at");
        dto.setPublishedAt(publishedAt != null ? publishedAt.toInstant().toString() : null);
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        dto.setUpdatedAt(updatedAt != null ? updatedAt.toInstant().toString() : null);

        dto.setSellerName(rs.getString("seller_name"));
        dto.setSellerRating(getNullableDouble(rs, "seller_rating"));
        dto.setSellerReviews(rs.getInt("seller_reviews"));
        dto.setCampusArea(rs.getString("seller_campus_area"));
        dto.setIsCampusVerified(rs.getInt("is_campus_verified") == 1);

        String imageUrl = rs.getString("image_url");
        dto.setImageUrl(imageUrl);
        if (imageUrl != null && !imageUrl.isBlank()) {
            dto.setImages(List.of(imageUrl));
        }

        dto.setMinReservePrice(getNullableDouble(rs, "min_reserve_price"));
        dto.setDropPercentage(getNullableDouble(rs, "drop_percentage"));

        Timestamp nextDropAt = rs.getTimestamp("next_drop_at");
        dto.setNextDropAt(nextDropAt != null ? nextDropAt.toInstant().toString() : null);

        Object isHaltedObj = rs.getObject("is_halted");
        if (isHaltedObj instanceof Number num) {
            dto.setIsHalted(num.intValue() == 1);
        } else if (isHaltedObj instanceof Boolean boolVal) {
            dto.setIsHalted(boolVal);
        } else {
            dto.setIsHalted(false);
        }

        return dto;
    }

    private static Double getNullableDouble(ResultSet rs, String column) throws SQLException {
        Object obj = rs.getObject(column);
        if (obj == null) {
            return null;
        }
        if (obj instanceof BigDecimal bd) {
            return bd.doubleValue();
        }
        if (obj instanceof Number num) {
            return num.doubleValue();
        }
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Map<String, Object> readJsonBody(HttpServletRequest request) throws IOException {
        byte[] bytes = request.getInputStream().readAllBytes();
        String raw = new String(bytes, StandardCharsets.UTF_8).trim();
        if (raw.isEmpty()) {
            return null;
        }
        return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
    }

    private static String matchAllowed(List<String> allowed, String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        for (String candidate : allowed) {
            if (candidate.equalsIgnoreCase(trimmed)) {
                return candidate;
            }
        }
        return null;
    }

    private static Double parseDouble(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof Number num) {
            return num.doubleValue();
        }
        String s = val.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static Integer parseInteger(Object val) {
        if (val == null) {
            return null;
        }
        if (val instanceof Integer i) {
            return i;
        }
        if (val instanceof Number num) {
            return num.intValue();
        }
        String s = val.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException ignored) {
            try {
                double d = Double.parseDouble(s);
                if (!Double.isNaN(d) && !Double.isInfinite(d)) {
                    return (int) d;
                }
            } catch (NumberFormatException ignoredAgain) {
                return null;
            }
            return null;
        }
    }

    private static boolean parseBoolean(Object val, boolean defaultVal) {
        if (val == null) {
            return defaultVal;
        }
        if (val instanceof Boolean b) {
            return b;
        }
        if (val instanceof Number num) {
            return num.intValue() == 1;
        }
        String s = val.toString().trim().toLowerCase(Locale.ROOT);
        if (s.isEmpty()) {
            return defaultVal;
        }
        return "true".equals(s) || "1".equals(s) || "on".equals(s) || "yes".equals(s);
    }

    private static String firstParam(MultipartHttpServletRequest req, String... keys) {
        String val = firstParamOrNull(req, keys);
        return val != null ? val.trim() : "";
    }

    private static String firstParamOrNull(MultipartHttpServletRequest req, String... keys) {
        for (String key : keys) {
            String val = req.getParameter(key);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        return null;
    }

    private static String firstNonBlank(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                String s = val.toString().trim();
                if (!s.isEmpty()) {
                    return s;
                }
            }
        }
        return "";
    }

    private static Object firstValue(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key) && map.get(key) != null) {
                return map.get(key);
            }
        }
        return null;
    }

    private static ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("error", message);
        err.put("message", message);
        return ResponseEntity.status(status).body(err);
    }
}
