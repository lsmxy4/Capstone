package com.fitmap.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:auth-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class AuthControllerTest {
    @Autowired MockMvc mvc;

    @Test
    void rootOpensFrontend() throws Exception {
        mvc.perform(get("/")).andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl("http://localhost:5173/"));
    }

    @Test
    void signupLoginAndLogout() throws Exception {
        String signup = """
            {"name":"Tester","nickname":"runner","email":"TEST@example.com","password":"password123","agreeTerms":true,"agreePrivacy":true}
            """;
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signup))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.user.email").value("test@example.com"));
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signup))
            .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"test@example.com\",\"password\":\"wrongpass\"}"))
            .andExpect(status().isUnauthorized());
        String header = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"TEST@example.com\",\"password\":\"password123\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getHeader("Set-Cookie");
        Cookie cookie = new Cookie("fitmap_session", header.split("[=;]")[1]);
        mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(status().isOk())
            .andExpect(jsonPath("$.user.nickname").value("runner"));
        mvc.perform(post("/api/auth/logout").cookie(cookie)).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());
    }

    @Test
    void routePointsArePrivateAndGroupedByKoreanDate() throws Exception {
        String email = "route-" + UUID.randomUUID() + "@example.com";
        String signup = """
            {"name":"Walker","nickname":"path","email":"%s","password":"password123","agreeTerms":true,"agreePrivacy":true}
            """.formatted(email);
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signup))
            .andExpect(status().isCreated());
        String login = "{\"email\":\"%s\",\"password\":\"password123\"}".formatted(email);
        String header = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
            .andExpect(status().isOk()).andReturn().getResponse().getHeader("Set-Cookie");
        Cookie cookie = new Cookie("fitmap_session", header.split("[=;]")[1]);
        Instant now = Instant.now();
        String day = now.atZone(ZoneId.of("Asia/Seoul")).toLocalDate().toString();
        String point = "{\"id\":\"%s\",\"latitude\":37.5,\"longitude\":127.0,\"recordedAt\":\"%s\"}"
            .formatted(UUID.randomUUID(), now);
        mvc.perform(post("/api/auth/routes").contentType(MediaType.APPLICATION_JSON).content(point))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/routes").cookie(cookie).contentType(MediaType.APPLICATION_JSON).content(point))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.date").value(day));
        String previousDay = LocalDate.parse(day).minusDays(1).toString();
        Instant previousInstant = LocalDate.parse(day).atStartOfDay(ZoneId.of("Asia/Seoul"))
            .minusSeconds(1).toInstant();
        String previousPoint = "{\"id\":\"%s\",\"latitude\":37.6,\"longitude\":127.1,\"recordedAt\":\"%s\"}"
            .formatted(UUID.randomUUID(), previousInstant);
        mvc.perform(post("/api/auth/routes").cookie(cookie).contentType(MediaType.APPLICATION_JSON).content(previousPoint))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.date").value(previousDay));
        mvc.perform(get("/api/auth/routes").cookie(cookie).param("date", day))
            .andExpect(status().isOk()).andExpect(jsonPath("$.points.length()").value(1))
            .andExpect(jsonPath("$.points[0].latitude").value(37.5));
        mvc.perform(get("/api/auth/routes").cookie(cookie).param("date", previousDay))
            .andExpect(status().isOk()).andExpect(jsonPath("$.points.length()").value(1))
            .andExpect(jsonPath("$.points[0].latitude").value(37.6));
        mvc.perform(get("/api/auth/routes/dates").cookie(cookie))
            .andExpect(status().isOk()).andExpect(jsonPath("$.dates[0]").value(day));
    }
}
