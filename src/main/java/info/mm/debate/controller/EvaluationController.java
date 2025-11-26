package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Evaluation;
import info.mm.debate.service.EvaluationService;
import info.mm.debate.websocket.DebateWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing evaluations by judges
 */
@RestController
@RequestMapping("/debates/{debateId}/evaluations")
@RequiredArgsConstructor
@Slf4j
public class EvaluationController {
    
    private final EvaluationService evaluationService;
    private final DebateWebSocketHandler webSocketHandler;
    
    /**
     * Get all evaluations for a debate
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Evaluation>>> getEvaluations(@PathVariable String debateId) {
        log.info("GET /api/debates/{}/evaluations", debateId);
        
        List<Evaluation> evaluations = evaluationService.getEvaluationsForDebate(debateId);
        return ResponseEntity.ok(ApiResponse.success(evaluations, "Evaluations retrieved successfully"));
    }
    
    /**
     * Get evaluations by a specific judge
     */
    @GetMapping("/by-judge/{judgeId}")
    public ResponseEntity<ApiResponse<List<Evaluation>>> getEvaluationsByJudge(
            @PathVariable String debateId,
            @PathVariable String judgeId) {
        log.info("GET /api/debates/{}/evaluations/by-judge/{}", debateId, judgeId);
        
        List<Evaluation> evaluations = evaluationService.getEvaluationsByJudge(debateId, judgeId);
        return ResponseEntity.ok(ApiResponse.success(evaluations, "Evaluations retrieved successfully"));
    }
    
    /**
     * Add a new evaluation
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Evaluation>> addEvaluation(
            @PathVariable String debateId,
            @RequestBody Evaluation evaluation,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("POST /api/debates/{}/evaluations", debateId);
        
        // Set judge ID from JWT
        String judgeId = jwt.getSubject();
        evaluation.setJudgeId(judgeId);
        
        // Set judge name from JWT
        String judgeName = jwt.getClaim("name");
        if (judgeName == null || judgeName.isEmpty()) {
            judgeName = jwt.getClaim("preferred_username");
        }
        evaluation.setJudgeName(judgeName);
        
        try {
            return evaluationService.addEvaluation(debateId, evaluation)
                    .map(savedEvaluation -> {
                        // Broadcast evaluation to all participants via WebSocket
                        webSocketHandler.broadcastEvaluationAdded(debateId, savedEvaluation);
                        
                        return ResponseEntity.ok(
                                ApiResponse.success(savedEvaluation, "Evaluation added successfully")
                        );
                    })
                    .orElseGet(() -> ResponseEntity.badRequest().body(
                            ApiResponse.error("Failed to add evaluation")
                    ));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid evaluation request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Update an existing evaluation
     */
    @PutMapping("/{evaluationId}")
    public ResponseEntity<ApiResponse<Evaluation>> updateEvaluation(
            @PathVariable String debateId,
            @PathVariable String evaluationId,
            @RequestBody Evaluation evaluation,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("PUT /api/debates/{}/evaluations/{}", debateId, evaluationId);
        
        // Set judge ID from JWT to verify ownership
        String judgeId = jwt.getSubject();
        evaluation.setJudgeId(judgeId);
        
        try {
            return evaluationService.updateEvaluation(debateId, evaluationId, evaluation)
                    .map(updatedEvaluation -> {
                        // Broadcast evaluation update to all participants via WebSocket
                        webSocketHandler.broadcastEvaluationUpdated(debateId, updatedEvaluation);
                        
                        return ResponseEntity.ok(
                                ApiResponse.success(updatedEvaluation, "Evaluation updated successfully")
                        );
                    })
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid evaluation update request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Delete an evaluation
     */
    @DeleteMapping("/{evaluationId}")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(
            @PathVariable String debateId,
            @PathVariable String evaluationId,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("DELETE /api/debates/{}/evaluations/{}", debateId, evaluationId);
        
        String judgeId = jwt.getSubject();
        
        boolean deleted = evaluationService.deleteEvaluation(debateId, evaluationId, judgeId);
        
        if (deleted) {
            // Broadcast evaluation deletion to all participants via WebSocket
            webSocketHandler.broadcastEvaluationDeleted(debateId, evaluationId);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Evaluation deleted successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

