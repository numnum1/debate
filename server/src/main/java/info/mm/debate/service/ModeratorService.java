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
public class ModeratorService {
    
    private final DebateRepository debateRepository;
    
    /**
     * Add a moderator to a debate
     * @throws IllegalArgumentException if user is already a participant in a position
     * @throws IllegalArgumentException if user is an AI
     * @throws IllegalArgumentException if user is a judge
     * @throws IllegalArgumentException if current user is not the owner
     */
    @Transactional
    public Optional<Debate> addModerator(String debateId, User moderator, User currentUser) {
        log.info("Adding moderator {} to debate {} by user {}", moderator.getId(), debateId, currentUser.getId());
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that current user is the owner
                    if (!isOwner(debate, currentUser.getId())) {
                        throw new IllegalArgumentException("Only the owner can add moderators");
                    }
                    
                    // Validate that moderator is not an AI
                    if (isAiUser(moderator)) {
                        throw new IllegalArgumentException("AI users cannot be moderators");
                    }
                    
                    // Validate that moderator is not a judge
                    if (isAlreadyJudge(debate, moderator.getId())) {
                        throw new IllegalArgumentException("Judges cannot be moderators");
                    }
                    
                    // Validate that moderator is not already a participant in any position
                    if (isParticipantInAnyPosition(debate, moderator.getId())) {
                        throw new IllegalArgumentException("User is already a participant in a position and cannot be a moderator");
                    }
                    
                    // Initialize moderators list if null
                    if (debate.getModerators() == null) {
                        debate.setModerators(new ArrayList<>());
                    }
                    
                    // Check if already a moderator
                    if (isAlreadyModerator(debate, moderator.getId())) {
                        throw new IllegalArgumentException("User is already a moderator");
                    }
                    
                    // Add moderator
                    debate.getModerators().add(moderator);
                    debate.setUpdatedAt(LocalDateTime.now());
                    
                    debateRepository.save(debate);
                    log.info("Moderator {} added successfully to debate {}", moderator.getId(), debateId);
                    
                    return debate;
                });
    }
    
    /**
     * Remove a moderator from a debate
     * @throws IllegalArgumentException if current user is not the owner
     */
    @Transactional
    public Optional<Debate> removeModerator(String debateId, String userId, User currentUser) {
        log.info("Removing moderator {} from debate {} by user {}", userId, debateId, currentUser.getId());
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that current user is the owner
                    if (!isOwner(debate, currentUser.getId())) {
                        throw new IllegalArgumentException("Only the owner can remove moderators");
                    }
                    
                    if (debate.getModerators() == null) {
                        throw new IllegalArgumentException("No moderators found");
                    }
                    
                    boolean removed = debate.getModerators().removeIf(mod -> mod.getId().equals(userId));
                    
                    if (!removed) {
                        throw new IllegalArgumentException("User is not a moderator");
                    }
                    
                    debate.setUpdatedAt(LocalDateTime.now());
                    debateRepository.save(debate);
                    
                    log.info("Moderator {} removed successfully from debate {}", userId, debateId);
                    return debate;
                });
    }
    
    /**
     * Get all moderators for a debate
     */
    public Optional<List<User>> getModerators(String debateId) {
        return debateRepository.findById(debateId)
                .map(Debate::getModerators);
    }
    
    /**
     * Check if a user is a moderator in a debate
     */
    public boolean isModerator(String debateId, String userId) {
        return debateRepository.findById(debateId)
                .map(debate -> isAlreadyModerator(debate, userId))
                .orElse(false);
    }
    
    /**
     * Validate that a user can be added to a position slot
     * @throws IllegalArgumentException if user is a moderator
     */
    public void validateUserCanBeParticipant(String debateId, String userId) {
        debateRepository.findById(debateId).ifPresent(debate -> {
            if (isAlreadyModerator(debate, userId)) {
                throw new IllegalArgumentException("Moderators cannot participate in positions");
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
    
    private boolean isAlreadyModerator(Debate debate, String userId) {
        if (debate.getModerators() == null) {
            return false;
        }
        
        return debate.getModerators().stream()
                .anyMatch(mod -> mod.getId().equals(userId));
    }
    
    private boolean isAlreadyJudge(Debate debate, String userId) {
        if (debate.getJudges() == null) {
            return false;
        }
        
        return debate.getJudges().stream()
                .anyMatch(judge -> judge.getId().equals(userId));
    }
}

