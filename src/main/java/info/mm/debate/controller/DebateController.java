package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Debate;
import info.mm.debate.service.DebateService;
import info.mm.debate.service.UserService;
import info.mm.debate.websocket.DebateWebSocketHandler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/debates")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Debates", description = "Debate Management API - CRUD-Operationen für Debatten")
@SecurityRequirement(name = "bearerAuth")
public class DebateController {
    
    private final DebateService debateService;
    private final UserService userService;
    private final DebateWebSocketHandler webSocketHandler;
    
    @Operation(
            summary = "Alle Debatten abrufen",
            description = "Ruft eine Liste aller verfügbaren Debatten ab. Erfordert Authentifizierung."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Erfolgreich - Liste der Debatten zurückgegeben",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Nicht authentifiziert - JWT Token erforderlich"
            )
    })
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Debate>>> getAllDebates() {
        log.info("GET /debates - Fetching all debates");
        List<Debate> debates = debateService.getAllDebates();
        return ResponseEntity.ok(ApiResponse.success(debates));
    }
    
    @Operation(
            summary = "Debate nach ID abrufen",
            description = "Ruft eine spezifische Debate anhand ihrer ID ab."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Erfolgreich - Debate gefunden"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Debate nicht gefunden"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Nicht authentifiziert"
            )
    })
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> getDebateById(
            @Parameter(description = "ID der Debate", required = true)
            @PathVariable String id) {
        log.info("GET /debates/{} - Fetching debate", id);
        return debateService.getDebateById(id)
                .map(debate -> ResponseEntity.ok(ApiResponse.success(debate)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Debate>>> getDebatesByStatus(@PathVariable Debate.DebateStatus status) {
        log.info("GET /debates/status/{} - Fetching debates by status", status);
        List<Debate> debates = debateService.getDebatesByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(debates));
    }
    
    @GetMapping("/my-debates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Debate>>> getMyDebates(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("GET /debates/my-debates - Fetching debates for user: {}", userId);
        List<Debate> debates = debateService.getDebatesByCreator(userId);
        return ResponseEntity.ok(ApiResponse.success(debates));
    }
    
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Debate>>> searchDebates(@RequestParam String title) {
        log.info("GET /debates/search?title={} - Searching debates", title);
        List<Debate> debates = debateService.searchDebatesByTitle(title);
        return ResponseEntity.ok(ApiResponse.success(debates));
    }
    
    @Operation(
            summary = "Neue Debate erstellen",
            description = "Erstellt eine neue Debate. Der authentifizierte Benutzer wird automatisch als Creator gesetzt."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Debate erfolgreich erstellt"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Ungültige Eingabedaten"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Nicht authentifiziert"
            )
    })
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> createDebate(
            @Parameter(description = "Debate-Daten", required = true)
            @Valid @RequestBody Debate debate,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        log.info("POST /debates - Creating new debate by user: {}", jwt.getSubject());
        
        // Extract user from JWT
        var creator = userService.getUserFromJwt(jwt);
        
        Debate createdDebate = debateService.createDebate(debate, creator);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdDebate, "Debate created successfully"));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> updateDebate(
            @PathVariable String id,
            @Valid @RequestBody Debate debate,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("PUT /debates/{} - Updating debate by user: {}", id, jwt.getSubject());
        
        return debateService.updateDebate(id, debate)
                .map(updated -> {
                    // Broadcast debate update via WebSocket
                    webSocketHandler.broadcastDebateUpdate(id, updated);
                    
                    return ResponseEntity.ok(
                            ApiResponse.success(updated, "Debate updated successfully"));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    @Operation(
            summary = "Debate löschen",
            description = "Löscht eine Debate. Nur der Ersteller der Debate darf sie löschen."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Debate erfolgreich gelöscht"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Keine Berechtigung - nur der Ersteller darf löschen"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Debate nicht gefunden"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Nicht authentifiziert"
            )
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteDebate(
            @Parameter(description = "ID der zu löschenden Debate", required = true)
            @PathVariable String id,
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        log.info("DELETE /debates/{} - Deleting debate by user: {}", id, jwt.getSubject());
        
        // Check if user is creator or admin
        boolean isOwner = debateService.getDebateById(id)
                .map(d -> d.getCreatedBy() != null && d.getCreatedBy().getId().equals(jwt.getSubject()))
                .orElse(false);
        
        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You are not allowed to delete this debate"));
        }
        
        boolean deleted = debateService.deleteDebate(id);
        if (deleted) {
            return ResponseEntity.ok(ApiResponse.success(null, "Debate deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Debate not found"));
    }
    
    @GetMapping("/stats/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> countDebatesByStatus(@RequestParam Debate.DebateStatus status) {
        log.info("GET /debates/stats/count?status={} - Counting debates", status);
        long count = debateService.countDebatesByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}

