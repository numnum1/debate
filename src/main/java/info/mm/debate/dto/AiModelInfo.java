package info.mm.debate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO für KI-Modell-Informationen
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModelInfo {
    /**
     * Eindeutiger Identifier des Modells (z.B. "gpt-4", "claude-3-opus")
     */
    private String id;
    
    /**
     * Anzeigename des Modells
     */
    private String name;
    
    /**
     * Anbieter des Modells (z.B. "OpenAI", "Anthropic")
     */
    private String provider;
    
    /**
     * Kurze Beschreibung der Fähigkeiten des Modells
     */
    private String description;
    
    /**
     * Ob das Modell aktuell verfügbar ist
     */
    @Builder.Default
    private boolean available = true;
}

