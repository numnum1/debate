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
        
        // EECC Modelle
        models.add(AiModelInfo.builder()
                .id("claude-sonnet-4-20250514")
                .name("Claude Sonnet 4")
                .provider("EECC")
                .description("Claude Sonnet 4 über EECC API")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("claude-sonnet-4-5-20250929")
                .name("Claude Sonnet 4.5")
                .provider("EECC")
                .description("Claude Sonnet 4.5 über EECC API - Neueste Version mit erweiterten Fähigkeiten")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("qwen3-coder")
                .name("Qwen3 Coder")
                .provider("EECC")
                .description("Qwen3 Coder - Spezialisiert auf Code-Generierung und technische Diskussionen")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("qwen3-coder-max")
                .name("Qwen3 Coder Max")
                .provider("EECC")
                .description("Qwen3 Coder Max - Erweiterte Version für komplexe Programmieraufgaben")
                .available(true)
                .build());
        
        models.add(AiModelInfo.builder()
                .id("claude-opus-4-1-20250805")
                .name("Claude Opus 4.1")
                .provider("EECC")
                .description("Claude Opus 4.1 über EECC API - Höchste Leistung für anspruchsvolle Debatten")
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

