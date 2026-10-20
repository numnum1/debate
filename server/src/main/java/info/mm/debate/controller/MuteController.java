package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Debate;
import info.mm.debate.model.User;
import info.mm.debate.service.MuteService;
import info.mm.debate.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debates/{debateId}/mute")
@RequiredArgsConstructor
@Slf4j
public class MuteController {
    
    private final MuteService muteService;
    private final UserService userService;
    
    /**
     * Mute a participant in a debate
     */
    @PostMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> muteParticipant(
            @PathVariable String debateId,
            @PathVariable String userId,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("POST /debates/{}/mute/{} - Muting participant by user {}", debateId, userId, jwt.getSubject());
        
        try {
            // Extract current user from JWT
            User currentUser = userService.getUserFromJwt(jwt);
            
            return muteService.muteParticipant(debateId, userId, currentUser)
                    .map(debate -> ResponseEntity.ok()
                            .body(ApiResponse.success(debate, "Participant muted successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Debate not found")));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to mute participant: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Unmute a participant in a debate
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> unmuteParticipant(
            @PathVariable String debateId,
            @PathVariable String userId,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("DELETE /debates/{}/mute/{} - Unmuting participant by user {}", debateId, userId, jwt.getSubject());
        
        try {
            // Extract current user from JWT
            User currentUser = userService.getUserFromJwt(jwt);
            
            return muteService.unmuteParticipant(debateId, userId, currentUser)
                    .map(debate -> ResponseEntity.ok()
                            .body(ApiResponse.success(debate, "Participant unmuted successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Debate not found")));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to unmute participant: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Check if a user is muted in a debate
     */
    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isMuted(
            @PathVariable String debateId,
            @PathVariable String userId) {
        log.info("GET /debates/{}/mute/{} - Checking if participant is muted", debateId, userId);
        
        boolean muted = muteService.isMuted(debateId, userId);
        return ResponseEntity.ok(ApiResponse.success(muted));
    }
}

