package info.mm.debate.config;

import info.mm.debate.websocket.DebateWebSocketHandler;
import info.mm.debate.websocket.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final DebateWebSocketHandler debateWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(debateWebSocketHandler, "/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(webSocketAuthInterceptor);
    }
}

