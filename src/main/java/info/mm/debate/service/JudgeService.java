package info.mm.debate.service;

import info.mm.debate.model.Debate;
import info.mm.debate.model.User;
import info.mm.debate.repository.DebateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class JudgeService {
    
    private final DebateRepository debateRepository;
    
    /**
     * Add a judge to a debate
     * @throws IllegalArgumentException if user is already a participant in a position
     * @throws IllegalArgumentException if user is an AI
     * @throws IllegalArgumentException if user is the owner
     * @throws IllegalArgumentException if user is a moderator
     * @throws IllegalArgumentException if current user is not the owner
     */
    @Transactional
    public Optional<Debate> addJudge(String debateId, User judge, User currentUser) {
        log.info("Adding judge {} to debate {} by user {}", judge.getId(), debateId, currentUser.getId());
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that current user is the owner
                    if (!isOwner(debate, currentUser.getId())) {
                        throw new IllegalArgumentException("Only the owner can add judges");
                    }
                    
                    // Validate that judge is not the owner
                    if (isOwner(debate, judge.getId())) {
                        throw new IllegalArgumentException("The owner cannot be a judge");
                    }
                    
                    // Validate that judge is not an AI
                    if (isAiUser(judge)) {
                        throw new IllegalArgumentException("AI users cannot be judges");
                    }
                    
                    // Validate that judge is not a moderator
                    if (isAlreadyModerator(debate, judge.getId())) {
                        throw new IllegalArgumentException("Moderators cannot be judges");
                    }
                    
                    // Validate that judge is not already a participant in any position
                    if (isParticipantInAnyPosition(debate, judge.getId())) {
                        throw new IllegalArgumentException("User is already a participant in a position and cannot be a judge");
                    }
                    
                    // Initialize judges list if null
                    if (debate.getJudges() == null) {
                        debate.setJudges(new ArrayList<>());
                    }
                    
                    // Check if already a judge
                    if (isAlreadyJudge(debate, judge.getId())) {
                        throw new IllegalArgumentException("User is already a judge");
                    }
                    
                    // Add judge
                    debate.getJudges().add(judge);
                    debate.setUpdatedAt(LocalDateTime.now());
                    
                    debateRepository.save(debate);
                    log.info("Judge {} added successfully to debate {}", judge.getId(), debateId);
                    
                    return debate;
                });
    }
    
    /**
     * Remove a judge from a debate
     * @throws IllegalArgumentException if current user is not the owner
     */
    @Transactional
    public Optional<Debate> removeJudge(String debateId, String userId, User currentUser) {
        log.info("Removing judge {} from debate {} by user {}", userId, debateId, currentUser.getId());
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that current user is the owner
                    if (!isOwner(debate, currentUser.getId())) {
                        throw new IllegalArgumentException("Only the owner can remove judges");
                    }
                    
                    if (debate.getJudges() == null) {
                        throw new IllegalArgumentException("No judges found");
                    }
                    
                    boolean removed = debate.getJudges().removeIf(judge -> judge.getId().equals(userId));
                    
                    if (!removed) {
                        throw new IllegalArgumentException("User is not a judge");
                    }
                    
                    debate.setUpdatedAt(LocalDateTime.now());
                    debateRepository.save(debate);
                    
                    log.info("Judge {} removed successfully from debate {}", userId, debateId);
                    return debate;
                });
    }
    
    /**
     * Get all judges for a debate
     */
    public Optional<List<User>> getJudges(String debateId) {
        return debateRepository.findById(debateId)
                .map(Debate::getJudges);
    }
    
    /**
     * Check if a user is a judge in a debate
     */
    public boolean isJudge(String debateId, String userId) {
        return debateRepository.findById(debateId)
                .map(debate -> isAlreadyJudge(debate, userId))
                .orElse(false);
    }
    
    /**
     * Validate that a user can be added to a position slot
     * @throws IllegalArgumentException if user is a judge
     */
    public void validateUserCanBeParticipant(String debateId, String userId) {
        debateRepository.findById(debateId).ifPresent(debate -> {
            if (isAlreadyJudge(debate, userId)) {
                throw new IllegalArgumentException("Judges cannot participate in positions");
            }
        });
    }
    
    // Helper methods
    
    private boolean isOwner(Debate debate, String userId) {
        return debate.getCreatedBy() != null && 
               debate.getCreatedBy().getId() != null && 
               debate.getCreatedBy().getId().equals(userId);
    }
    
    private boolean isAiUser(User user) {
        // AI users are identified by having an ID that starts with "ai-" or by having null email
        return user.getId() != null && user.getId().startsWith("ai-");
    }
    
    private boolean isParticipantInAnyPosition(Debate debate, String userId) {
        if (debate.getPositions() == null) {
            return false;
        }
        
        return debate.getPositions().stream()
                .filter(position -> position.getSlots() != null)
                .flatMap(position -> position.getSlots().stream())
                .anyMatch(slot -> slot.getParticipant() != null && 
                                 slot.getParticipant().getId().equals(userId));
    }
    
    private boolean isAlreadyJudge(Debate debate, String userId) {
        if (debate.getJudges() == null) {
            return false;
        }
        
        return debate.getJudges().stream()
                .anyMatch(judge -> judge.getId().equals(userId));
    }
    
    private boolean isAlreadyModerator(Debate debate, String userId) {
        if (debate.getModerators() == null) {
            return false;
        }
        
        return debate.getModerators().stream()
                .anyMatch(mod -> mod.getId().equals(userId));
    }
}

