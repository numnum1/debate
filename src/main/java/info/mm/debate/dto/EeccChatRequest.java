package info.mm.debate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO für EECC API Chat Completion Requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EeccChatRequest {
    
    /**
     * Das zu verwendende Modell
     */
    private String model;
    
    /**
     * Liste der Chat-Nachrichten
     */
    private List<ChatMessage> messages;
    
    /**
     * Temperatur für die Generierung (0-2)
     */
    @Builder.Default
    private Double temperature = 0.7;
    
    /**
     * Maximale Anzahl von Tokens in der Antwort
     */
    @JsonProperty("max_tokens")
    private Integer maxTokens;
    
    /**
     * Whether to stream the response
     */
    @Builder.Default
    private Boolean stream = false;
    
    /**
     * DTO für einzelne Chat-Nachricht
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessage {
        /**
         * Rolle des Nachrichtensenders (system, user, assistant)
         */
        private String role;
        
        /**
         * Inhalt der Nachricht
         */
        private String content;
    }
}

