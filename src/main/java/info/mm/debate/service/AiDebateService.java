package info.mm.debate.service;

import info.mm.debate.dto.EeccChatRequest;
import info.mm.debate.dto.EeccChatResponse;
import info.mm.debate.model.*;
import info.mm.debate.repository.DebateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service für KI-gesteuerte Antworten in Debatten
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiDebateService {
    
    private final EeccApiService eeccApiService;
    private final MessageService messageService;
    private final DebateRepository debateRepository;
    
    // Callback-Interface für Broadcasting
    private BroadcastCallback broadcastCallback;
    
    /**
     * Setzt den Callback für das Broadcasting von KI-Nachrichten
     */
    public void setBroadcastCallback(BroadcastCallback callback) {
        this.broadcastCallback = callback;
    }
    
    /**
     * Prüft ob KI-Teilnehmer auf eine neue Nachricht antworten sollten
     * und generiert deren Antworten
     * 
     * @param debateId Die ID der Debatte
     * @param newMessage Die neue Nachricht, die gerade hinzugefügt wurde
     */
    public void processAiResponses(String debateId, DebateMessage newMessage) {
        log.debug("Processing AI responses for debate: {}", debateId);
        
        debateRepository.findById(debateId).ifPresent(debate -> {
            // Finde alle KI-Slots, die antworten sollten
            List<AiSlotInfo> aiSlotsToRespond = findAiSlotsToRespond(debate, newMessage);
            
            if (aiSlotsToRespond.isEmpty()) {
                log.debug("No AI slots need to respond");
                return;
            }
            
            log.info("Found {} AI slot(s) that should respond", aiSlotsToRespond.size());
            
            // Generiere Antworten für jeden KI-Slot
            for (AiSlotInfo aiSlot : aiSlotsToRespond) {
                try {
                    generateAndSaveAiResponse(debate, aiSlot, newMessage);
                } catch (Exception e) {
                    log.error("Error generating AI response for slot {} in debate {}: {}", 
                            aiSlot.getSlot().getId(), debateId, e.getMessage(), e);
                }
            }
        });
    }
    
    /**
     * Findet alle KI-Slots, die auf die Nachricht antworten sollten
     */
    private List<AiSlotInfo> findAiSlotsToRespond(Debate debate, DebateMessage newMessage) {
        List<AiSlotInfo> result = new ArrayList<>();
        
        // Finde die Position der neuen Nachricht
        String messagePositionId = newMessage.getPositionId();
        
        // Durchsuche alle Positionen nach KI-Slots
        for (Position position : debate.getPositions()) {
            // Skip die Position, von der die Nachricht kam
            if (position.getId().equals(messagePositionId)) {
                continue;
            }
            
            // Prüfe alle Slots in dieser Position
            for (Slot slot : position.getSlots()) {
                if (slot.getType() == Slot.SlotType.ai && slot.getAiConfig() != null) {
                    result.add(new AiSlotInfo(position, slot));
                    log.debug("AI slot {} in position {} should respond", 
                            slot.getId(), position.getName());
                }
            }
        }
        
        return result;
    }
    
    /**
     * Generiert eine KI-Antwort und speichert sie
     */
    private void generateAndSaveAiResponse(Debate debate, AiSlotInfo aiSlot, DebateMessage triggerMessage) {
        log.info("Generating AI response for slot {} in position {}", 
                aiSlot.getSlot().getId(), aiSlot.getPosition().getName());
        
        // Bereite Chat-Verlauf vor
        List<EeccChatRequest.ChatMessage> chatMessages = buildChatHistory(
                debate, 
                aiSlot.getPosition(), 
                aiSlot.getSlot()
        );
        
        // Erstelle EECC API Request
        EeccChatRequest request = EeccChatRequest.builder()
                .model(aiSlot.getSlot().getAiConfig().getModel())
                .messages(chatMessages)
                .temperature(0.7)
                .maxTokens(1500)
                .build();
        
        try {
            // Rufe EECC API auf
            EeccChatResponse response = eeccApiService.createChatCompletion(request);
            
            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String aiResponseText = response.getChoices().get(0).getMessage().getContent();
                
                // Erstelle und speichere die KI-Nachricht
                DebateMessage aiMessage = DebateMessage.builder()
                        .id(UUID.randomUUID().toString())
                        .userId("ai-" + aiSlot.getSlot().getId())
                        .userName(getAiName(aiSlot))
                        .text(aiResponseText)
                        .timestamp(LocalDateTime.now())
                        .positionId(aiSlot.getPosition().getId())
                        .slotId(aiSlot.getSlot().getId())
                        .build();
                
                // Speichere die Nachricht
                messageService.addMessageToDebate(debate.getId(), aiMessage).ifPresent(savedMessage -> {
                    log.info("✓ AI response generated and saved for slot {} in position {}", 
                            aiSlot.getSlot().getId(), aiSlot.getPosition().getName());
                    
                    // Broadcaste die KI-Antwort über WebSocket
                    if (broadcastCallback != null) {
                        broadcastCallback.broadcast(debate.getId(), savedMessage);
                    }
                });
                
            } else {
                log.warn("No response from EECC API for slot {}", aiSlot.getSlot().getId());
            }
            
        } catch (Exception e) {
            log.error("Error calling EECC API for slot {}: {}", 
                    aiSlot.getSlot().getId(), e.getMessage(), e);
        }
    }
    
    /**
     * Baut den Chat-Verlauf für die KI auf
     */
    private List<EeccChatRequest.ChatMessage> buildChatHistory(Debate debate, Position aiPosition, Slot aiSlot) {
        List<EeccChatRequest.ChatMessage> messages = new ArrayList<>();
        
        // System-Prompt mit Kontext der Debatte und Position
        String systemPrompt = buildSystemPrompt(debate, aiPosition, aiSlot);
        messages.add(EeccChatRequest.ChatMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());
        
        // Füge alle bisherigen Nachrichten hinzu
        if (debate.getMessages() != null) {
            for (DebateMessage msg : debate.getMessages()) {
                // Finde die Position der Nachricht
                String positionName = findPositionName(debate, msg.getPositionId());
                
                // Bestimme die Rolle basierend auf der Position
                String role = msg.getPositionId().equals(aiPosition.getId()) ? "assistant" : "user";
                
                // Formatiere die Nachricht mit Kontext
                String content = String.format("[%s - %s]: %s", 
                        positionName, 
                        msg.getUserName(), 
                        msg.getText());
                
                messages.add(EeccChatRequest.ChatMessage.builder()
                        .role(role)
                        .content(content)
                        .build());
            }
        }
        
        return messages;
    }
    
    /**
     * Erstellt den System-Prompt für die KI
     */
    private String buildSystemPrompt(Debate debate, Position aiPosition, Slot aiSlot) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Du bist ein KI-Teilnehmer in einer Debatte.\n\n");
        prompt.append("Debatte: ").append(debate.getTitle()).append("\n");
        
        if (debate.getDescription() != null && !debate.getDescription().isEmpty()) {
            prompt.append("Beschreibung: ").append(debate.getDescription()).append("\n");
        }
        
        prompt.append("\nDeine Position: ").append(aiPosition.getName()).append("\n");
        
        if (aiPosition.getDescription() != null && !aiPosition.getDescription().isEmpty()) {
            prompt.append("Beschreibung deiner Position: ").append(aiPosition.getDescription()).append("\n");
        }
        
        // Füge Persönlichkeit hinzu, falls vorhanden
        if (aiSlot.getAiConfig() != null && aiSlot.getAiConfig().getPersonality() != null) {
            prompt.append("\nDeine Persönlichkeit/Rolle: ").append(aiSlot.getAiConfig().getPersonality()).append("\n");
        }
        
        prompt.append("\nAnweisungen:\n");
        prompt.append("- Argumentiere aus der Perspektive deiner Position\n");
        prompt.append("- Antworte auf die Argumente der anderen Teilnehmer\n");
        prompt.append("- Bleibe sachlich und respektvoll\n");
        prompt.append("- Halte deine Antworten prägnant (2-4 Sätze)\n");
        prompt.append("- Verwende überzeugende Argumente und Beispiele\n");
        
        return prompt.toString();
    }
    
    /**
     * Findet den Namen einer Position anhand ihrer ID
     */
    private String findPositionName(Debate debate, String positionId) {
        return debate.getPositions().stream()
                .filter(p -> p.getId().equals(positionId))
                .map(Position::getName)
                .findFirst()
                .orElse("Unbekannt");
    }
    
    /**
     * Generiert einen Namen für die KI
     */
    private String getAiName(AiSlotInfo aiSlot) {
        String modelName = aiSlot.getSlot().getAiConfig().getModel();
        String positionName = aiSlot.getPosition().getName();
        
        // Kürze den Modellnamen
        String shortModelName;
        if (modelName.contains("claude-sonnet-4-5")) {
            shortModelName = "Claude 4.5";
        } else if (modelName.contains("claude-sonnet-4")) {
            shortModelName = "Claude 4";
        } else if (modelName.contains("claude-opus-4")) {
            shortModelName = "Claude Opus";
        } else if (modelName.contains("qwen3-coder-max")) {
            shortModelName = "Qwen3 Max";
        } else if (modelName.contains("qwen3-coder")) {
            shortModelName = "Qwen3";
        } else {
            shortModelName = "AI";
        }
        
        return String.format("%s (%s)", shortModelName, positionName);
    }
    
    /**
     * Hilfsklasse für KI-Slot-Informationen
     */
    private static class AiSlotInfo {
        private final Position position;
        private final Slot slot;
        
        public AiSlotInfo(Position position, Slot slot) {
            this.position = position;
            this.slot = slot;
        }
        
        public Position getPosition() {
            return position;
        }
        
        public Slot getSlot() {
            return slot;
        }
    }
    
    /**
     * Callback-Interface für Broadcasting von Nachrichten
     */
    @FunctionalInterface
    public interface BroadcastCallback {
        void broadcast(String debateId, DebateMessage message);
    }
}

