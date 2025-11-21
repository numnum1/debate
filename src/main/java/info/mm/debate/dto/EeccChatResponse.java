package info.mm.debate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO für EECC API Chat Completion Responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EeccChatResponse {
    
    /**
     * Eindeutige ID der Response
     */
    private String id;
    
    /**
     * Objekttyp (z.B. "chat.completion")
     */
    private String object;
    
    /**
     * Zeitstempel der Erstellung
     */
    private Long created;
    
    /**
     * Das verwendete Modell
     */
    private String model;
    
    /**
     * Liste der generierten Choices
     */
    private List<Choice> choices;
    
    /**
     * Token-Nutzungsstatistiken
     */
    private Usage usage;
    
    /**
     * DTO für eine einzelne Choice
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Choice {
        /**
         * Index der Choice
         */
        private Integer index;
        
        /**
         * Die generierte Nachricht
         */
        private Message message;
        
        /**
         * Grund für das Ende der Generierung (z.B. "stop", "length")
         */
        @JsonProperty("finish_reason")
        private String finishReason;
    }
    
    /**
     * DTO für eine Nachricht in der Response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        /**
         * Rolle des Absenders
         */
        private String role;
        
        /**
         * Inhalt der Nachricht
         */
        private String content;
    }
    
    /**
     * DTO für Token-Nutzungsstatistiken
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Usage {
        /**
         * Anzahl der Prompt-Tokens
         */
        @JsonProperty("prompt_tokens")
        private Integer promptTokens;
        
        /**
         * Anzahl der Completion-Tokens
         */
        @JsonProperty("completion_tokens")
        private Integer completionTokens;
        
        /**
         * Gesamtanzahl der Tokens
         */
        @JsonProperty("total_tokens")
        private Integer totalTokens;
    }
}

