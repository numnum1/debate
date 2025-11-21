package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.dto.EeccChatRequest;
import info.mm.debate.dto.EeccChatResponse;
import info.mm.debate.service.EeccApiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller für EECC API-Aufrufe
 */
@RestController
@RequestMapping("/eecc")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "EECC API", description = "EECC KI-Modell API - Chat Completions mit EECC Modellen")
@SecurityRequirement(name = "bearerAuth")
public class EeccController {
    
    private final EeccApiService eeccApiService;
    
    @Operation(
            summary = "Chat Completion erstellen",
            description = "Erstellt eine Chat Completion mit einem EECC-Modell. Unterstützt Claude Sonnet 4, Claude Sonnet 4.5, Qwen3 Coder, Qwen3 Coder Max und Claude Opus 4.1."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Erfolgreich - Chat Completion erstellt",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Ungültige Anfrage"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Nicht authentifiziert - JWT Token erforderlich"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Interner Serverfehler oder EECC API Fehler"
            )
    })
    @PostMapping("/chat/completions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EeccChatResponse>> createChatCompletion(
            @Valid @RequestBody EeccChatRequest request
    ) {
        log.info("POST /eecc/chat/completions - Creating chat completion with model: {}", request.getModel());
        
        try {
            EeccChatResponse response = eeccApiService.createChatCompletion(request);
            return ResponseEntity.ok(ApiResponse.success(
                    response, 
                    "Chat completion successfully created"
            ));
        } catch (Exception e) {
            log.error("Error creating chat completion: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to create chat completion: " + e.getMessage()));
        }
    }
}

