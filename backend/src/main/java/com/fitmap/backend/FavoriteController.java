package com.fitmap.backend;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth/favorites")
public class FavoriteController {
    private final JdbcTemplate jdbc;
    private final SessionAuth sessionAuth;

    public FavoriteController(JdbcTemplate jdbc, SessionAuth sessionAuth) {
        this.jdbc = jdbc;
        this.sessionAuth = sessionAuth;
    }

    public record PlaceInput(String id, String name, String category, String address, Double distance,
                             Double latitude, Double longitude, String url) {}
    public record FavoritePlace(String id, String name, String category, String address, Double distance,
                                Double latitude, Double longitude, String url, Instant savedAt) {}

    @GetMapping
    public Map<String, List<FavoritePlace>> list(@CookieValue(name = "fitmap_session", required = false) String token) {
        UUID userId = sessionAuth.requireUser(token);
        List<FavoritePlace> favorites = jdbc.query("""
            SELECT place_id, name, category, address, distance_meters, latitude, longitude, url, created_at
            FROM favorite_places WHERE user_id = ? ORDER BY created_at DESC, place_id
            """, (rs, row) -> new FavoritePlace(rs.getString("place_id"), rs.getString("name"),
                rs.getString("category"), rs.getString("address"), rs.getObject("distance_meters", Double.class),
                rs.getObject("latitude", Double.class), rs.getObject("longitude", Double.class),
                rs.getString("url"), rs.getObject("created_at", OffsetDateTime.class).toInstant()), userId);
        return Map.of("favorites", favorites);
    }

    @PutMapping("/{placeId}")
    public Map<String, PlaceInput> add(@CookieValue(name = "fitmap_session", required = false) String token,
                                        @PathVariable String placeId, @RequestBody PlaceInput place) {
        UUID userId = sessionAuth.requireUser(token);
        validate(placeId, place);
        jdbc.update("""
            MERGE INTO favorite_places (user_id, place_id, name, category, address, distance_meters,
                latitude, longitude, url, created_at) KEY (user_id, place_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, userId, placeId, place.name().trim(), place.category().trim(), place.address().trim(),
            place.distance(), place.latitude(), place.longitude(),
            place.url() == null ? null : place.url().replaceFirst("^http:", "https:"), Instant.now());
        return Map.of("favorite", place);
    }

    @DeleteMapping("/{placeId}")
    public Map<String, Boolean> remove(@CookieValue(name = "fitmap_session", required = false) String token,
                                        @PathVariable String placeId) {
        UUID userId = sessionAuth.requireUser(token);
        jdbc.update("DELETE FROM favorite_places WHERE user_id = ? AND place_id = ?", userId, placeId);
        return Map.of("removed", true);
    }

    private void validate(String placeId, PlaceInput place) {
        if (place == null || placeId.isBlank() || placeId.length() > 100 || !placeId.equals(place.id()) ||
            invalidText(place.name(), 200) || invalidText(place.category(), 300) || invalidText(place.address(), 300) ||
            (place.distance() != null && (!Double.isFinite(place.distance()) || place.distance() < 0)) ||
            (place.latitude() != null && (!Double.isFinite(place.latitude()) || place.latitude() < -90 || place.latitude() > 90)) ||
            (place.longitude() != null && (!Double.isFinite(place.longitude()) || place.longitude() < -180 || place.longitude() > 180)) ||
            (place.url() != null && (place.url().length() > 500 || !place.url().matches("https?://place\\.map\\.kakao\\.com/[^\\s]+")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 장소 정보를 보내주세요.");
        }
    }

    private boolean invalidText(String value, int max) {
        return value == null || value.isBlank() || value.trim().length() > max;
    }
}
