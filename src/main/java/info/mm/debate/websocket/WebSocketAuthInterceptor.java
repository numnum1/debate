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
            
            if (query != null && query.contains("token=")) {
                String token = extractToken(query);
                
                if (token != null) {
                    // Validate token
                    Jwt jwt = jwtDecoder.decode(token);
                    
                    // Store user info in attributes for later use
                    attributes.put("userId", jwt.getSubject());
                    attributes.put("userName", jwt.getClaimAsString("name"));
                    attributes.put("userEmail", jwt.getClaimAsString("email"));
                    
                    log.info("WebSocket connection authenticated for user: {}", jwt.getSubject());
                    return true;
                }
            }
            
            log.warn("WebSocket connection rejected: No valid token provided");
            return false;
            
        } catch (Exception e) {
            log.error("WebSocket authentication failed", e);
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

