package info.mm.debate.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.mm.debate.dto.WebSocketMessage;
import info.mm.debate.model.DebateMessage;
import info.mm.debate.service.AiDebateService;
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
    private final AiDebateService aiDebateService;
    
    // Map: debateId -> Set of sessions in that debate room
    private final Map<String, CopyOnWriteArraySet<WebSocketSession>> debateRooms = new ConcurrentHashMap<>();
    
    // Map: sessionId -> debateId (for tracking which room a session is in)
    private final Map<String, String> sessionDebateMap = new ConcurrentHashMap<>();

    /**
     * Initialisierung nach der Konstruktion
     */
    @jakarta.annotation.PostConstruct
    public void init() {
        // Setze den Broadcast-Callback für den AiDebateService
        aiDebateService.setBroadcastCallback(this::broadcastAiMessage);
        aiDebateService.setTypingCallback(this::broadcastAiTyping);
        log.info("AI Debate Service callbacks configured");
    }

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
                case "debate:thread:start":
                    handleThreadStart(session, wsMessage);
                    break;
                case "debate:typing":
                    handleDebateTyping(session, wsMessage);
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
            String userName = (String) session.getAttributes().get("userName");
            
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
                    log.info("Removed session {} from old room: {}", session.getId(), oldDebateId);
                }
            }
            
            // Add to new room
            debateRooms.computeIfAbsent(debateId, k -> new CopyOnWriteArraySet<>()).add(session);
            sessionDebateMap.put(session.getId(), debateId);
            
            int sessionCount = debateRooms.get(debateId).size();
            log.info("=".repeat(60));
            log.info("✓ Session {} (User: {}) joined debate room: {}", session.getId(), userName, debateId);
            log.info("  Total sessions in this room: {}", sessionCount);
            log.info("=".repeat(60));
            
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
                                
                                // Trigger KI-Antworten asynchron
                                new Thread(() -> {
                                    try {
                                        aiDebateService.processAiResponses(debateId, savedMessage);
                                    } catch (Exception e) {
                                        log.error("Error processing AI responses: {}", e.getMessage(), e);
                                    }
                                }).start();
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

    private void handleThreadStart(WebSocketSession session, WebSocketMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            String debateId = (String) payload.get("debateId");
            String threadStarterMessageId = (String) payload.get("threadStarterMessageId");
            
            if (debateId == null || threadStarterMessageId == null) {
                sendError(session, "debateId and threadStarterMessageId are required");
                return;
            }
            
            log.info("Thread started for message {} in debate {}", threadStarterMessageId, debateId);
            
            // Broadcast thread start to all users in the room
            WebSocketMessage threadStartMessage = WebSocketMessage.builder()
                    .type("debate:thread:started")
                    .payload(Map.of(
                            "debateId", debateId,
                            "threadStarterMessageId", threadStarterMessageId
                    ))
                    .timestamp(LocalDateTime.now())
                    .build();
            
            broadcastToDebateRoom(debateId, threadStartMessage);
            
        } catch (Exception e) {
            log.error("✗ Error handling debate:thread:start: {}", e.getMessage(), e);
            sendError(session, "Error starting thread: " + e.getMessage());
        }
    }

    private void handleDebateTyping(WebSocketSession session, WebSocketMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            String debateId = (String) payload.get("debateId");
            String userId = (String) session.getAttributes().get("userId");
            String userName = (String) session.getAttributes().get("userName");
            Boolean isTyping = (Boolean) payload.get("isTyping");
            
            if (debateId == null || isTyping == null) {
                sendError(session, "debateId and isTyping are required");
                return;
            }
            
            log.debug("Typing indicator: user {} in debate {} - isTyping: {}", userName, debateId, isTyping);
            
            // Broadcast typing status to other users in the room (excluding sender)
            WebSocketMessage typingMessage = WebSocketMessage.builder()
                    .type("debate:typing:update")
                    .payload(Map.of(
                            "userId", userId,
                            "userName", userName,
                            "isTyping", isTyping
                    ))
                    .timestamp(LocalDateTime.now())
                    .build();
            
            broadcastToDebateRoomExcept(debateId, typingMessage, session);
            
        } catch (Exception e) {
            log.error("✗ Error handling debate:typing: {}", e.getMessage(), e);
            sendError(session, "Error processing typing status: " + e.getMessage());
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

    private void broadcastToDebateRoomExcept(String debateId, WebSocketMessage message, WebSocketSession excludeSession) {
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
            // Skip the session we want to exclude
            if (session.getId().equals(excludeSession.getId())) {
                continue;
            }
            
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

    /**
     * Broadcast a debate update to all sessions in a debate room
     * This is used when a debate is modified (e.g., position added, status changed)
     * 
     * @param debateId The ID of the debate that was updated
     * @param debate The updated debate object
     */
    public void broadcastDebateUpdate(String debateId, Object debate) {
        CopyOnWriteArraySet<WebSocketSession> sessions = debateRooms.get(debateId);
        int sessionCount = sessions != null ? sessions.size() : 0;
        
        log.info("=".repeat(60));
        log.info("Broadcasting debate update to room: {}", debateId);
        log.info("Active sessions in this room: {}", sessionCount);
        log.info("=".repeat(60));
        
        WebSocketMessage updateMessage = WebSocketMessage.builder()
                .type("debate:updated")
                .payload(debate)
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, updateMessage);
        
        log.info("✓ Debate update broadcast completed for room: {}", debateId);
    }
    
    /**
     * Broadcast einer KI-Nachricht an alle Teilnehmer
     * Wird vom AiDebateService aufgerufen
     * 
     * @param debateId Die ID der Debatte
     * @param aiMessage Die KI-Nachricht
     */
    public void broadcastAiMessage(String debateId, DebateMessage aiMessage) {
        log.info("Broadcasting AI message from {} to debate room: {}", aiMessage.getUserName(), debateId);
        
        WebSocketMessage broadcastMessage = WebSocketMessage.builder()
                .type("debate:message:received")
                .payload(aiMessage)
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, broadcastMessage);
        
        log.info("✓ AI message broadcasted to debate room: {}", debateId);
    }
    
    /**
     * Broadcast eines KI-Typing-Indikators an alle Teilnehmer
     * Wird vom AiDebateService aufgerufen
     * 
     * @param debateId Die ID der Debatte
     * @param userId Die User-ID der KI
     * @param userName Der Name der KI
     * @param isTyping Ob die KI gerade tippt/denkt
     */
    public void broadcastAiTyping(String debateId, String userId, String userName, boolean isTyping) {
        log.debug("Broadcasting AI typing status: {} - {} is {}", debateId, userName, isTyping ? "typing" : "stopped");
        
        WebSocketMessage typingMessage = WebSocketMessage.builder()
                .type("debate:typing:update")
                .payload(Map.of(
                        "userId", userId,
                        "userName", userName,
                        "isTyping", isTyping
                ))
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, typingMessage);
    }
    
    /**
     * Broadcast einer neuen Bewertung an alle Teilnehmer
     * 
     * @param debateId Die ID der Debatte
     * @param evaluation Die neue Bewertung
     */
    public void broadcastEvaluationAdded(String debateId, Object evaluation) {
        log.info("Broadcasting new evaluation to debate room: {}", debateId);
        
        WebSocketMessage evaluationMessage = WebSocketMessage.builder()
                .type("debate:evaluation:added")
                .payload(evaluation)
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, evaluationMessage);
        
        log.info("✓ Evaluation broadcast completed for room: {}", debateId);
    }
    
    /**
     * Broadcast einer aktualisierten Bewertung an alle Teilnehmer
     * 
     * @param debateId Die ID der Debatte
     * @param evaluation Die aktualisierte Bewertung
     */
    public void broadcastEvaluationUpdated(String debateId, Object evaluation) {
        log.info("Broadcasting updated evaluation to debate room: {}", debateId);
        
        WebSocketMessage evaluationMessage = WebSocketMessage.builder()
                .type("debate:evaluation:updated")
                .payload(evaluation)
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, evaluationMessage);
        
        log.info("✓ Evaluation update broadcast completed for room: {}", debateId);
    }
    
    /**
     * Broadcast einer gelöschten Bewertung an alle Teilnehmer
     * 
     * @param debateId Die ID der Debatte
     * @param evaluationId Die ID der gelöschten Bewertung
     */
    public void broadcastEvaluationDeleted(String debateId, String evaluationId) {
        log.info("Broadcasting deleted evaluation to debate room: {}", debateId);
        
        WebSocketMessage evaluationMessage = WebSocketMessage.builder()
                .type("debate:evaluation:deleted")
                .payload(Map.of("evaluationId", evaluationId))
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, evaluationMessage);
        
        log.info("✓ Evaluation deletion broadcast completed for room: {}", debateId);
    }
    
    /**
     * Broadcast eines Mute-Ereignisses an alle Teilnehmer
     * 
     * @param debateId Die ID der Debatte
     * @param userId Die ID des gemuteten Benutzers
     * @param userName Der Name des gemuteten Benutzers
     */
    public void broadcastParticipantMuted(String debateId, String userId, String userName) {
        log.info("Broadcasting participant muted to debate room: {} (User: {})", debateId, userName);
        
        WebSocketMessage muteMessage = WebSocketMessage.builder()
                .type("debate:participant:muted")
                .payload(Map.of(
                        "userId", userId,
                        "userName", userName
                ))
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, muteMessage);
        
        log.info("✓ Participant muted broadcast completed for room: {}", debateId);
    }
    
    /**
     * Broadcast eines Unmute-Ereignisses an alle Teilnehmer
     * 
     * @param debateId Die ID der Debatte
     * @param userId Die ID des unmuted Benutzers
     * @param userName Der Name des unmuted Benutzers
     */
    public void broadcastParticipantUnmuted(String debateId, String userId, String userName) {
        log.info("Broadcasting participant unmuted to debate room: {} (User: {})", debateId, userName);
        
        WebSocketMessage unmuteMessage = WebSocketMessage.builder()
                .type("debate:participant:unmuted")
                .payload(Map.of(
                        "userId", userId,
                        "userName", userName
                ))
                .timestamp(LocalDateTime.now())
                .build();
        
        broadcastToDebateRoom(debateId, unmuteMessage);
        
        log.info("✓ Participant unmuted broadcast completed for room: {}", debateId);
    }
}

