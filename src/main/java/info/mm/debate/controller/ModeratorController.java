package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Debate;
import info.mm.debate.model.User;
import info.mm.debate.service.ModeratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/debates/{debateId}/moderators")
@RequiredArgsConstructor
@Slf4j
public class ModeratorController {
    
    private final ModeratorService moderatorService;
    
    /**
     * Get all moderators for a debate
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<User>>> getModerators(@PathVariable String debateId) {
        log.info("GET /debates/{}/moderators - Fetching moderators", debateId);
        
        return moderatorService.getModerators(debateId)
                .map(moderators -> ResponseEntity.ok(ApiResponse.success(moderators)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    /**
     * Add a moderator to a debate
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> addModerator(
            @PathVariable String debateId,
            @Valid @RequestBody User moderator) {
        log.info("POST /debates/{}/moderators - Adding moderator {}", debateId, moderator.getId());
        
        try {
            return moderatorService.addModerator(debateId, moderator)
                    .map(debate -> ResponseEntity.status(HttpStatus.CREATED)
                            .body(ApiResponse.success(debate, "Moderator added successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Debate not found")));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to add moderator: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Remove a moderator from a debate
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> removeModerator(
            @PathVariable String debateId,
            @PathVariable String userId) {
        log.info("DELETE /debates/{}/moderators/{} - Removing moderator", debateId, userId);
        
        try {
            return moderatorService.removeModerator(debateId, userId)
                    .map(debate -> ResponseEntity.ok(ApiResponse.success(debate, "Moderator removed successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Debate not found")));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to remove moderator: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Check if a user is a moderator
     */
    @GetMapping("/check/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isModerator(
            @PathVariable String debateId,
            @PathVariable String userId) {
        log.info("GET /debates/{}/moderators/check/{} - Checking if user is moderator", debateId, userId);
        
        boolean isMod = moderatorService.isModerator(debateId, userId);
        return ResponseEntity.ok(ApiResponse.success(isMod));
    }
}

