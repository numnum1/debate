package info.mm.debate.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.mm.debate.dto.WebSocketMessage;
import info.mm.debate.model.DebateMessage;
import info.mm.debate.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@RequiredArgsConstructor
@Slf4j
public class DebateWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    
    // Map: debateId -> Set of sessions in that debate room
    private final Map<String, CopyOnWriteArraySet<WebSocketSession>> debateRooms = new ConcurrentHashMap<>();
    
    // Map: sessionId -> debateId (for tracking which room a session is in)
    private final Map<String, String> sessionDebateMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = (String) session.getAttributes().get("userId");
        String userName = (String) session.getAttributes().get("userName");
        
        log.info("✓ WebSocket connection established - Session ID: {}, User: {} ({})", 
                session.getId(), userName, userId);
        log.info("   Remote Address: {}", session.getRemoteAddress());
        log.info("   URI: {}", session.getUri());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) throws Exception {
        try {
            String payload = textMessage.getPayload();
            log.debug("Received WebSocket message: {}", payload);
            
            WebSocketMessage wsMessage = objectMapper.readValue(payload, WebSocketMessage.class);
            String type = wsMessage.getType();
            
            switch (type) {
                case "debate:join":
                    handleDebateJoin(session, wsMessage);
                    break;
                case "debate:leave":
                    handleDebateLeave(session, wsMessage);
                    break;
                case "debate:message":
                    handleDebateMessage(session, wsMessage);
                    break;
                default:
                    log.warn("Unknown message type: {}", type);
                    sendError(session, "Unknown message type: " + type);
            }
            
        } catch (Exception e) {
            log.error("Error handling WebSocket message", e);
            sendError(session, "Error processing message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {} - {}", session.getId(), status);
        
        // Remove session from debate room
        String debateId = sessionDebateMap.remove(session.getId());
        if (debateId != null) {
            CopyOnWriteArraySet<WebSocketSession> sessions = debateRooms.get(debateId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    debateRooms.remove(debateId);
                }
            }
        }
    }

    private void handleDebateJoin(WebSocketSession session, WebSocketMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            String debateId = (String) payload.get("debateId");
            
            if (debateId == null) {
                sendError(session, "debateId is required");
                return;
            }
            
            // Remove from old room if any
            String oldDebateId = sessionDebateMap.get(session.getId());
            if (oldDebateId != null) {
                CopyOnWriteArraySet<WebSocketSession> oldSessions = debateRooms.get(oldDebateId);
                if (oldSessions != null) {
                    oldSessions.remove(session);
                }
            }
            
            // Add to new room
            debateRooms.computeIfAbsent(debateId, k -> new CopyOnWriteArraySet<>()).add(session);
            sessionDebateMap.put(session.getId(), debateId);
            
            log.info("Session {} joined debate room: {}", session.getId(), debateId);
            
        } catch (Exception e) {
            log.error("Error handling debate:join", e);
            sendError(session, "Error joining debate: " + e.getMessage());
        }
    }

    private void handleDebateLeave(WebSocketSession session, WebSocketMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            String debateId = (String) payload.get("debateId");
            
            if (debateId == null) {
                sendError(session, "debateId is required");
                return;
            }
            
            // Remove from room
            CopyOnWriteArraySet<WebSocketSession> sessions = debateRooms.get(debateId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    debateRooms.remove(debateId);
                }
            }
            sessionDebateMap.remove(session.getId());
            
            log.info("Session {} left debate room: {}", session.getId(), debateId);
            
        } catch (Exception e) {
            log.error("Error handling debate:leave", e);
            sendError(session, "Error leaving debate: " + e.getMessage());
        }
    }

    private void handleDebateMessage(WebSocketSession session, WebSocketMessage message) {
        try {
            // Parse payload
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            
            // Extract debateId and message from payload
            String debateId = (String) payload.get("debateId");
            Object messageObj = payload.get("message");
            
            log.debug("Received message for debate: {}", debateId);
            
            if (debateId == null || messageObj == null) {
                sendError(session, "debateId and message are required");
                return;
            }
            
            // Convert the nested message object to DebateMessage
            DebateMessage debateMessage = objectMapper.convertValue(messageObj, DebateMessage.class);
            
            log.debug("Parsed message from user: {} - {}", debateMessage.getUserName(), debateMessage.getText());
            
            // Save message to database
            messageService.addMessageToDebate(debateId, debateMessage)
                    .ifPresentOrElse(
                            savedMessage -> {
                                // Broadcast to all sessions in this debate room
                                WebSocketMessage broadcastMessage = WebSocketMessage.builder()
                                        .type("debate:message:received")
                                        .payload(savedMessage)
                                        .timestamp(LocalDateTime.now())
                                        .build();
                                
                                broadcastToDebateRoom(debateId, broadcastMessage);
                                log.info("✓ Message broadcasted to debate room: {} (from {})", debateId, debateMessage.getUserName());
                            },
                            () -> {
                                sendError(session, "Failed to save message");
                                log.error("✗ Failed to save message to debate: {}", debateId);
                            }
                    );
            
        } catch (Exception e) {
            log.error("✗ Error handling debate:message: {}", e.getMessage(), e);
            sendError(session, "Error processing message: " + e.getMessage());
        }
    }

    private void broadcastToDebateRoom(String debateId, WebSocketMessage message) {
        CopyOnWriteArraySet<WebSocketSession> sessions = debateRooms.get(debateId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No sessions in debate room: {}", debateId);
            return;
        }
        
        String jsonMessage;
        try {
            jsonMessage = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("Error serializing message", e);
            return;
        }
        
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(jsonMessage));
                } catch (IOException e) {
                    log.error("Error sending message to session: {}", session.getId(), e);
                }
            }
        }
    }

    private void sendError(WebSocketSession session, String errorMessage) {
        if (!session.isOpen()) {
            return;
        }
        
        try {
            WebSocketMessage error = WebSocketMessage.builder()
                    .type("error")
                    .payload(Map.of("message", errorMessage))
                    .timestamp(LocalDateTime.now())
                    .build();
            
            String json = objectMapper.writeValueAsString(error);
            session.sendMessage(new TextMessage(json));
            
        } catch (Exception e) {
            log.error("Error sending error message", e);
        }
    }
}

