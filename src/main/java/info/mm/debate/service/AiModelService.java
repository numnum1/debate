package info.mm.debate.service;

import info.mm.debate.dto.AiModelInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service für die Verwaltung von verfügbaren KI-Modellen
 */
@Service
@Slf4j
public class AiModelService {
    
    /**
     * Gibt eine Liste aller verfügbaren KI-Modelle zurück
     * 
     * @return Liste von verfügbaren KI-Modellen
     */
    public List<AiModelInfo> getAvailableModels() {
        log.debug("Fetching available AI models");
        
        List<AiModelInfo> models = new ArrayList<>();
        
        // OpenAI Modelle
        models.add(AiModelInfo.builder()
                .id("gpt-4")
                .name("GPT-4")
                .provider("OpenAI")
                .description("Leistungsstarkes Sprachmodell mit hervorragenden Argumentationsfähigkeiten")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("gpt-4-turbo")
                .name("GPT-4 Turbo")
                .provider("OpenAI")
                .description("Schnellere Version von GPT-4 mit verbesserter Effizienz")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("gpt-3.5-turbo")
                .name("GPT-3.5 Turbo")
                .provider("OpenAI")
                .description("Schnelles und kosteneffizientes Modell für allgemeine Aufgaben")
                .available(true)
                .build());
        
        // Anthropic Modelle
        models.add(AiModelInfo.builder()
                .id("claude-3-opus")
                .name("Claude 3 Opus")
                .provider("Anthropic")
                .description("Höchste Intelligenz und Leistung für komplexe Debatten")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("claude-3-sonnet")
                .name("Claude 3 Sonnet")
                .provider("Anthropic")
                .description("Ausgewogenes Modell mit guter Leistung und Geschwindigkeit")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("claude-3-haiku")
                .name("Claude 3 Haiku")
                .provider("Anthropic")
                .description("Schnelles Modell für einfache Interaktionen")
                .available(true)
                .build());
        
        // Google Modelle
        models.add(AiModelInfo.builder()
                .id("gemini-pro")
                .name("Gemini Pro")
                .provider("Google")
                .description("Vielseitiges Modell mit starken Analysefähigkeiten")
                .available(true)
                .build());
        
        log.info("Returning {} available AI models", models.size());
        return models;
    }
    
    /**
     * Prüft ob ein bestimmtes Modell verfügbar ist
     * 
     * @param modelId Die ID des zu prüfenden Modells
     * @return true wenn das Modell verfügbar ist, sonst false
     */
    public boolean isModelAvailable(String modelId) {
        return getAvailableModels().stream()
                .anyMatch(model -> model.getId().equals(modelId) && model.isAvailable());
    }
}

