package info.mm.debate.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtDecoder jwtDecoder;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        
        try {
            URI uri = request.getURI();
            String query = uri.getQuery();
            
            log.debug("WebSocket handshake request - URI: {}", uri);
            log.debug("WebSocket handshake request - Query: {}", query);
            
            if (query != null && query.contains("token=")) {
                String token = extractToken(query);
                
                log.debug("Extracted token (first 50 chars): {}", token != null ? token.substring(0, Math.min(50, token.length())) : "null");
                
                if (token != null) {
                    // Validate token
                    log.debug("Attempting to decode JWT token...");
                    Jwt jwt = jwtDecoder.decode(token);
                    
                    // Store user info in attributes for later use
                    attributes.put("userId", jwt.getSubject());
                    attributes.put("userName", jwt.getClaimAsString("name"));
                    attributes.put("userEmail", jwt.getClaimAsString("email"));
                    
                    log.info("✓ WebSocket connection authenticated for user: {} ({})", 
                            jwt.getClaimAsString("name"), jwt.getSubject());
                    return true;
                }
            }
            
            log.trace("✗ WebSocket connection rejected: No valid token provided. Query: {}", query);
            return false;
            
        } catch (Exception e) {
            log.trace("✗ WebSocket authentication failed: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // Nothing to do after handshake
    }

    private String extractToken(String query) {
        String[] params = query.split("&");
        for (String param : params) {
            if (param.startsWith("token=")) {
                return param.substring(6);
            }
        }
        return null;
    }
}

