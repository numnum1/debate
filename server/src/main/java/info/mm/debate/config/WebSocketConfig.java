package info.mm.debate.config;

import info.mm.debate.websocket.DebateWebSocketHandler;
import info.mm.debate.websocket.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketConfigurer {

    private final DebateWebSocketHandler debateWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        log.info("Registering WebSocket handlers at /ws");
        
        registry.addHandler(debateWebSocketHandler, "/ws")
                .setAllowedOriginPatterns("*")
                .setAllowedOrigins("*") // Explizit alle Origins erlauben
                .addInterceptors(webSocketAuthInterceptor);
        
        log.info("WebSocket handlers registered successfully");
    }
}

