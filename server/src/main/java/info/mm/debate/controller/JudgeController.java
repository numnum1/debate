package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Debate;
import info.mm.debate.model.User;
import info.mm.debate.service.JudgeService;
import info.mm.debate.service.UserService;
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
@RequestMapping("/debates/{debateId}/judges")
@RequiredArgsConstructor
@Slf4j
public class JudgeController {
    
    private final JudgeService judgeService;
    private final UserService userService;
    
    /**
     * Get all judges for a debate
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<User>>> getJudges(@PathVariable String debateId) {
        log.info("GET /debates/{}/judges - Fetching judges", debateId);
        
        return judgeService.getJudges(debateId)
                .map(judges -> ResponseEntity.ok(ApiResponse.success(judges)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    /**
     * Add a judge to a debate
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> addJudge(
            @PathVariable String debateId,
            @Valid @RequestBody User judge,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("POST /debates/{}/judges - Adding judge {} by user {}", debateId, judge.getId(), jwt.getSubject());
        
        try {
            // Extract current user from JWT
            User currentUser = userService.getUserFromJwt(jwt);
            
            return judgeService.addJudge(debateId, judge, currentUser)
                    .map(debate -> ResponseEntity.status(HttpStatus.CREATED)
                            .body(ApiResponse.success(debate, "Judge added successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Debate not found")));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to add judge: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Remove a judge from a debate
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> removeJudge(
            @PathVariable String debateId,
            @PathVariable String userId,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("DELETE /debates/{}/judges/{} - Removing judge by user {}", debateId, userId, jwt.getSubject());
        
        try {
            // Extract current user from JWT
            User currentUser = userService.getUserFromJwt(jwt);
            
            return judgeService.removeJudge(debateId, userId, currentUser)
                    .map(debate -> ResponseEntity.ok(ApiResponse.success(debate, "Judge removed successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Debate not found")));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to remove judge: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Check if a user is a judge
     */
    @GetMapping("/check/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isJudge(
            @PathVariable String debateId,
            @PathVariable String userId) {
        log.info("GET /debates/{}/judges/check/{} - Checking if user is judge", debateId, userId);
        
        boolean isJdg = judgeService.isJudge(debateId, userId);
        return ResponseEntity.ok(ApiResponse.success(isJdg));
    }
}

