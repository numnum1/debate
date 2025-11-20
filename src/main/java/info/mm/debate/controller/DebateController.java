package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Debate;
import info.mm.debate.service.DebateService;
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
@RequestMapping("/debates")
@RequiredArgsConstructor
@Slf4j
public class DebateController {
    
    private final DebateService debateService;
    private final UserService userService;
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Debate>>> getAllDebates() {
        log.info("GET /debates - Fetching all debates");
        List<Debate> debates = debateService.getAllDebates();
        return ResponseEntity.ok(ApiResponse.success(debates));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> getDebateById(@PathVariable String id) {
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
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Debate>> createDebate(
            @Valid @RequestBody Debate debate,
            @AuthenticationPrincipal Jwt jwt) {
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
                .map(updated -> ResponseEntity.ok(
                        ApiResponse.success(updated, "Debate updated successfully")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteDebate(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
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

