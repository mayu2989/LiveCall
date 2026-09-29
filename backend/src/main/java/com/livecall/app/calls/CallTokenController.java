package com.livecall.app.calls;

import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanPublishData;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/calls")
public class CallTokenController {
    private final String liveKitUrl;
    private final String apiKey;
    private final String apiSecret;

    public CallTokenController(
            @Value("${livekit.url:}") String liveKitUrl,
            @Value("${livekit.api-key:}") String apiKey,
            @Value("${livekit.api-secret:}") String apiSecret) {
        this.liveKitUrl = liveKitUrl;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    @PostMapping("/token")
    public Map<String, String> createToken(@RequestBody TokenRequest request, Authentication authentication) {
        if (liveKitUrl.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "LiveKit is not configured");
        }
        if (request.roomName() == null || !request.roomName().matches("[a-zA-Z0-9_-]{3,64}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid room name");
        }
        String identity = authentication.getName();
        String displayName = identity;
        if (authentication.getPrincipal() instanceof OAuth2User user) {
            String fullName = user.getAttribute("name");
            String email = user.getAttribute("email");
            if (fullName != null && !fullName.isBlank()) displayName = fullName;
            else if (email != null && !email.isBlank()) displayName = email;
        }
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setIdentity(identity);
        token.setName(displayName);
        token.setTtl(5 * 60 * 1000);
        token.addGrants(
                new RoomJoin(true),
                new RoomName(request.roomName()),
                new CanPublish(true),
                new CanSubscribe(true),
                new CanPublishData(false));
        return Map.of("serverUrl", liveKitUrl, "token", token.toJwt());
    }

    public record TokenRequest(String roomName) {}
}
