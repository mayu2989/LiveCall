package com.livecall.app.config;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class AuthController {
    @GetMapping("/api/auth/me")
    public Map<String, Object> currentUser(Authentication authentication) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            result.put("authenticated", false);
            return result;
        }

        Object principal = authentication.getPrincipal();
        String email = authentication.getName();
        String name = email;
        String picture = null;
        if (principal instanceof OAuth2User user) {
            email = valueOr(user.getAttribute("email"), email);
            name = valueOr(user.getAttribute("name"), email);
            picture = user.getAttribute("picture");
        }

        result.put("authenticated", true);
        result.put("name", name);
        result.put("email", email);
        result.put("picture", picture);
        return result;
    }

    private String valueOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
