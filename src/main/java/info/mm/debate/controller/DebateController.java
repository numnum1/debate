package info.mm.debate.controller;

import info.mm.debate.model.Debate;
import info.mm.debate.service.DebateService;
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
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Debate>> getAllDebates() {
        log.info("GET /debates - Fetching all debates");
        List<Debate> debates = debateService.getAllDebates();
        return ResponseEntity.ok(debates);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Debate> getDebateById(@PathVariable String id) {
        log.info("GET /debates/{} - Fetching debate", id);
        return debateService.getDebateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Debate>> getDebatesByStatus(@PathVariable Debate.DebateStatus status) {
        log.info("GET /debates/status/{} - Fetching debates by status", status);
        List<Debate> debates = debateService.getDebatesByStatus(status);
        return ResponseEntity.ok(debates);
    }
    
    @GetMapping("/my-debates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Debate>> getMyDebates(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("GET /debates/my-debates - Fetching debates for user: {}", userId);
        List<Debate> debates = debateService.getDebatesByCreator(userId);
        return ResponseEntity.ok(debates);
    }
    
    @GetMapping("/participating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Debate>> getParticipatingDebates(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("GET /debates/participating - Fetching debates where user {} is participating", userId);
        List<Debate> debates = debateService.getDebatesByParticipant(userId);
        return ResponseEntity.ok(debates);
    }
    
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Debate>> searchDebates(@RequestParam String title) {
        log.info("GET /debates/search?title={} - Searching debates", title);
        List<Debate> debates = debateService.searchDebatesByTitle(title);
        return ResponseEntity.ok(debates);
    }
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Debate> createDebate(
            @Valid @RequestBody Debate debate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("POST /debates - Creating new debate by user: {}", userId);
        Debate createdDebate = debateService.createDebate(debate, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDebate);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Debate> updateDebate(
            @PathVariable String id,
            @Valid @RequestBody Debate debate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("PUT /debates/{} - Updating debate by user: {}", id, userId);
        return debateService.updateDebate(id, debate)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{id}/arguments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Debate> addArgument(
            @PathVariable String id,
            @Valid @RequestBody Debate.Argument argument,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("POST /debates/{}/arguments - Adding argument by user: {}", id, userId);
        return debateService.addArgument(id, argument, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @debateService.getDebateById(#id).map(d -> d.creatorId == authentication.principal.subject).orElse(false)")
    public ResponseEntity<Void> deleteDebate(@PathVariable String id) {
        log.info("DELETE /debates/{} - Deleting debate", id);
        boolean deleted = debateService.deleteDebate(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/stats/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> countDebatesByStatus(@RequestParam Debate.DebateStatus status) {
        log.info("GET /debates/stats/count?status={} - Counting debates", status);
        long count = debateService.countDebatesByStatus(status);
        return ResponseEntity.ok(count);
    }
}

