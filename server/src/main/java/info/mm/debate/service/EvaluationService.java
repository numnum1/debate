package info.mm.debate.service;

import info.mm.debate.model.Evaluation;
import info.mm.debate.repository.DebateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing evaluations by judges
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationService {
    
    private final DebateRepository debateRepository;
    private final JudgeService judgeService;
    
    /**
     * Get all evaluations for a debate
     */
    public List<Evaluation> getEvaluationsForDebate(String debateId) {
        log.info("Getting evaluations for debate: {}", debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> debate.getEvaluations() != null ? debate.getEvaluations() : new ArrayList<Evaluation>())
                .orElse(new ArrayList<>());
    }
    
    /**
     * Get all evaluations by a specific judge for a debate
     */
    public List<Evaluation> getEvaluationsByJudge(String debateId, String judgeId) {
        log.info("Getting evaluations by judge {} for debate: {}", judgeId, debateId);
        
        List<Evaluation> allEvaluations = getEvaluationsForDebate(debateId);
        return allEvaluations.stream()
                .filter(eval -> eval.getJudgeId().equals(judgeId))
                .toList();
    }
    
    /**
     * Add an evaluation to a debate
     */
    @Transactional
    public Optional<Evaluation> addEvaluation(String debateId, Evaluation evaluation) {
        log.info("Adding evaluation to debate: {}", debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Verify user is a judge
                    if (!judgeService.isJudge(debateId, evaluation.getJudgeId())) {
                        log.warn("User {} is not a judge for debate {}", evaluation.getJudgeId(), debateId);
                        throw new IllegalArgumentException("User is not a judge for this debate");
                    }
                    
                    // Generate ID and timestamp if not set
                    if (evaluation.getId() == null || evaluation.getId().isEmpty()) {
                        evaluation.setId(UUID.randomUUID().toString());
                    }
                    if (evaluation.getTimestamp() == null) {
                        evaluation.setTimestamp(LocalDateTime.now());
                    }
                    
                    // Set debateId
                    evaluation.setDebateId(debateId);
                    
                    // Add evaluation to debate
                    List<Evaluation> evaluations = debate.getEvaluations();
                    if (evaluations == null) {
                        evaluations = new ArrayList<>();
                        debate.setEvaluations(evaluations);
                    }
                    evaluations.add(evaluation);
                    
                    debate.setUpdatedAt(LocalDateTime.now());
                    debateRepository.save(debate);
                    
                    log.debug("Evaluation added successfully: {}", evaluation.getId());
                    return evaluation;
                });
    }
    
    /**
     * Update an existing evaluation
     */
    @Transactional
    public Optional<Evaluation> updateEvaluation(String debateId, String evaluationId, Evaluation updatedEvaluation) {
        log.info("Updating evaluation {} for debate: {}", evaluationId, debateId);
        
        return debateRepository.findById(debateId)
                .flatMap(debate -> {
                    List<Evaluation> evaluations = debate.getEvaluations();
                    if (evaluations == null) {
                        return Optional.empty();
                    }
                    
                    // Find the evaluation
                    Optional<Evaluation> existingEvalOpt = evaluations.stream()
                            .filter(e -> e.getId().equals(evaluationId))
                            .findFirst();
                    
                    if (existingEvalOpt.isEmpty()) {
                        return Optional.empty();
                    }
                    
                    Evaluation existingEval = existingEvalOpt.get();
                    
                    // Verify ownership
                    if (!existingEval.getJudgeId().equals(updatedEvaluation.getJudgeId())) {
                        log.warn("Judge {} cannot update evaluation by {}", updatedEvaluation.getJudgeId(), existingEval.getJudgeId());
                        throw new IllegalArgumentException("Cannot update evaluation created by another judge");
                    }
                    
                    // Update fields
                    existingEval.setTitle(updatedEvaluation.getTitle());
                    existingEval.setPoints(updatedEvaluation.getPoints());
                    existingEval.setComment(updatedEvaluation.getComment());
                    existingEval.setPositionId(updatedEvaluation.getPositionId());
                    existingEval.setMessageId(updatedEvaluation.getMessageId());
                    existingEval.setReferencedMessageIds(updatedEvaluation.getReferencedMessageIds());
                    
                    debate.setUpdatedAt(LocalDateTime.now());
                    debateRepository.save(debate);
                    
                    log.debug("Evaluation updated successfully: {}", evaluationId);
                    return Optional.of(existingEval);
                });
    }
    
    /**
     * Delete an evaluation
     */
    @Transactional
    public boolean deleteEvaluation(String debateId, String evaluationId, String judgeId) {
        log.info("Deleting evaluation {} from debate: {}", evaluationId, debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    List<Evaluation> evaluations = debate.getEvaluations();
                    if (evaluations == null) {
                        return false;
                    }
                    
                    // Find and verify ownership
                    Optional<Evaluation> evalToDelete = evaluations.stream()
                            .filter(e -> e.getId().equals(evaluationId) && e.getJudgeId().equals(judgeId))
                            .findFirst();
                    
                    if (evalToDelete.isEmpty()) {
                        log.warn("Evaluation {} not found or not owned by judge {}", evaluationId, judgeId);
                        return false;
                    }
                    
                    evaluations.remove(evalToDelete.get());
                    debate.setUpdatedAt(LocalDateTime.now());
                    debateRepository.save(debate);
                    
                    log.debug("Evaluation deleted successfully: {}", evaluationId);
                    return true;
                })
                .orElse(false);
    }
}

