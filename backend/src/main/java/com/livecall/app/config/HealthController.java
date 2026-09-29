package com.livecall.app.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.web.csrf.CsrfToken;

import java.util.Map;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "livecall-api");
    }

    @GetMapping("/api/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }
}
