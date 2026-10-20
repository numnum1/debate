package info.mm.debate.controller;

import info.mm.debate.dto.AiModelInfo;
import info.mm.debate.dto.ApiResponse;
import info.mm.debate.service.AiModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller für KI-Modell-Informationen
 */
@RestController
@RequestMapping("/ai/models")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Models", description = "KI-Modell API - Verfügbare KI-Modelle abrufen")
@SecurityRequirement(name = "bearerAuth")
public class AiModelController {
    
    private final AiModelService aiModelService;
    
    @Operation(
            summary = "Verfügbare KI-Modelle abrufen",
            description = "Ruft eine Liste aller verfügbaren KI-Modelle ab, die für Debatten-Slots verwendet werden können. Erfordert Authentifizierung."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Erfolgreich - Liste der verfügbaren KI-Modelle zurückgegeben",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Nicht authentifiziert - JWT Token erforderlich"
            )
    })
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AiModelInfo>>> getAvailableModels() {
        log.info("GET /ai/models - Fetching available AI models");
        List<AiModelInfo> models = aiModelService.getAvailableModels();
        return ResponseEntity.ok(ApiResponse.success(
                models, 
                String.format("Successfully retrieved %d available AI models", models.size())
        ));
    }
}

