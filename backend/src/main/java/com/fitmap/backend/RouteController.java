package com.fitmap.backend;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth/routes")
public class RouteController {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
    private final JdbcTemplate jdbc;

    public RouteController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record PointRequest(UUID id, Double latitude, Double longitude, Instant recordedAt) {}
    public record RoutePoint(UUID id, double latitude, double longitude, Instant recordedAt) {}

    @PostMapping
    public ResponseEntity<Map<String, Object>> append(
        @CookieValue(name = "fitmap_session", required = false) String token,
        @RequestBody PointRequest point
    ) {
        UUID userId = requireUser(token);
        validate(point);
        LocalDate date = point.recordedAt().atZone(KOREA).toLocalDate();
        try {
            jdbc.update("INSERT INTO route_points (id, user_id, route_date, recorded_at, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)",
                point.id(), userId, date, point.recordedAt(), point.latitude(), point.longitude());
        } catch (DuplicateKeyException duplicate) {
            Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM route_points WHERE id = ? AND user_id = ?", Integer.class, point.id(), userId);
            if (existing == null || existing == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "위치 기록 ID가 이미 사용 중입니다.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("date", date, "point", point));
    }

    @GetMapping
    public Map<String, Object> byDate(
        @CookieValue(name = "fitmap_session", required = false) String token,
        @RequestParam(required = false) LocalDate date
    ) {
        UUID userId = requireUser(token);
        LocalDate day = date == null ? LocalDate.now(KOREA) : date;
        List<RoutePoint> points = jdbc.query("""
            SELECT id, latitude, longitude, recorded_at FROM route_points
            WHERE user_id = ? AND route_date = ? ORDER BY recorded_at, id
            """, (rs, row) -> new RoutePoint(rs.getObject("id", UUID.class), rs.getDouble("latitude"),
                rs.getDouble("longitude"), rs.getObject("recorded_at", java.time.OffsetDateTime.class).toInstant()),
            userId, day);
        return Map.of("date", day, "points", points);
    }

    @GetMapping("/dates")
    public Map<String, List<LocalDate>> dates(@CookieValue(name = "fitmap_session", required = false) String token) {
        UUID userId = requireUser(token);
        List<LocalDate> dates = jdbc.query("""
            SELECT DISTINCT route_date FROM route_points WHERE user_id = ? ORDER BY route_date DESC
            """, (rs, row) -> rs.getObject("route_date", LocalDate.class), userId);
        return Map.of("dates", dates);
    }

    private UUID requireUser(String token) {
        if (token == null || token.isBlank()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        List<UUID> ids = jdbc.query("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?",
            (rs, row) -> rs.getObject("user_id", UUID.class), hash(token), Instant.now());
        if (ids.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        return ids.getFirst();
    }

    private void validate(PointRequest point) {
        if (point == null || point.id() == null || point.latitude() == null || point.longitude() == null ||
            !Double.isFinite(point.latitude()) || !Double.isFinite(point.longitude()) ||
            point.latitude() < -90 || point.latitude() > 90 || point.longitude() < -180 || point.longitude() > 180 ||
            point.recordedAt() == null || point.recordedAt().isBefore(Instant.now().minusSeconds(86400)) ||
            point.recordedAt().isAfter(Instant.now().plusSeconds(300))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효한 위치와 측정 시각을 보내주세요.");
        }
    }

    private static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }
}
