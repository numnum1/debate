package info.mm.debate.service;

import info.mm.debate.model.Debate;
import info.mm.debate.model.User;
import info.mm.debate.repository.DebateRepository;
import info.mm.debate.websocket.DebateWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MuteService {
    
    private final DebateRepository debateRepository;
    private final ModeratorService moderatorService;
    private final DebateWebSocketHandler webSocketHandler;
    
    /**
     * Mute a participant in a debate
     * @throws IllegalArgumentException if current user is not a moderator or owner
     * @throws IllegalArgumentException if target user is not a participant
     * @throws IllegalArgumentException if target user is already muted
     */
    @Transactional
    public Optional<Debate> muteParticipant(String debateId, String targetUserId, User currentUser) {
        log.info("Muting participant {} in debate {} by user {}", targetUserId, debateId, currentUser.getId());
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that current user is a moderator or owner
                    boolean isOwner = debate.getCreatedBy().getId().equals(currentUser.getId());
                    boolean isModerator = moderatorService.isModerator(debateId, currentUser.getId());
                    
                    if (!isOwner && !isModerator) {
                        throw new IllegalArgumentException("Only moderators and owners can mute participants");
                    }
                    
                    // Log all participants for debugging
                    log.info("DEBUG: Checking if userId {} is a participant", targetUserId);
                    if (debate.getPositions() != null) {
                        debate.getPositions().forEach(position -> {
                            log.info("DEBUG: Position {} with {} slots", position.getName(), 
                                     position.getSlots() != null ? position.getSlots().size() : 0);
                            if (position.getSlots() != null) {
                                position.getSlots().forEach(slot -> {
                                    if (slot.getParticipant() != null) {
                                        log.info("DEBUG: Slot has participant ID: {}", slot.getParticipant().getId());
                                    }
                                });
                            }
                        });
                    }
                    
                    // Validate that target user is a participant
                    if (!isParticipant(debate, targetUserId)) {
                        throw new IllegalArgumentException("Target user is not a participant in this debate");
                    }
                    
                    // Initialize mutedParticipants list if null
                    if (debate.getMutedParticipants() == null) {
                        debate.setMutedParticipants(new ArrayList<>());
                    }
                    
                    // Check if already muted
                    if (debate.getMutedParticipants().contains(targetUserId)) {
                        throw new IllegalArgumentException("User is already muted");
                    }
                    
                    // Mute participant
                    debate.getMutedParticipants().add(targetUserId);
                    debate.setUpdatedAt(LocalDateTime.now());
                    
                    debateRepository.save(debate);
                    log.info("Participant {} muted successfully in debate {}", targetUserId, debateId);
                    
                    // Get the user name for broadcast
                    String targetUserName = getParticipantName(debate, targetUserId);
                    
                    // Broadcast mute event to all participants
                    webSocketHandler.broadcastParticipantMuted(debateId, targetUserId, targetUserName);
                    
                    return debate;
                });
    }
    
    /**
     * Unmute a participant in a debate
     * @throws IllegalArgumentException if current user is not a moderator or owner
     * @throws IllegalArgumentException if target user is not muted
     */
    @Transactional
    public Optional<Debate> unmuteParticipant(String debateId, String targetUserId, User currentUser) {
        log.info("Unmuting participant {} in debate {} by user {}", targetUserId, debateId, currentUser.getId());
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that current user is a moderator or owner
                    boolean isOwner = debate.getCreatedBy().getId().equals(currentUser.getId());
                    boolean isModerator = moderatorService.isModerator(debateId, currentUser.getId());
                    
                    if (!isOwner && !isModerator) {
                        throw new IllegalArgumentException("Only moderators and owners can unmute participants");
                    }
                    
                    if (debate.getMutedParticipants() == null || !debate.getMutedParticipants().contains(targetUserId)) {
                        throw new IllegalArgumentException("User is not muted");
                    }
                    
                    // Unmute participant
                    debate.getMutedParticipants().remove(targetUserId);
                    debate.setUpdatedAt(LocalDateTime.now());
                    
                    debateRepository.save(debate);
                    log.info("Participant {} unmuted successfully in debate {}", targetUserId, debateId);
                    
                    // Get the user name for broadcast
                    String targetUserName = getParticipantName(debate, targetUserId);
                    
                    // Broadcast unmute event to all participants
                    webSocketHandler.broadcastParticipantUnmuted(debateId, targetUserId, targetUserName);
                    
                    return debate;
                });
    }
    
    /**
     * Check if a user is muted in a debate
     */
    public boolean isMuted(String debateId, String userId) {
        return debateRepository.findById(debateId)
                .map(debate -> debate.getMutedParticipants() != null && 
                              debate.getMutedParticipants().contains(userId))
                .orElse(false);
    }
    
    /**
     * Check if a user is a participant in any position
     */
    private boolean isParticipant(Debate debate, String userId) {
        if (debate.getPositions() == null) {
            return false;
        }
        
        return debate.getPositions().stream()
                .anyMatch(position -> position.getSlots() != null && 
                         position.getSlots().stream()
                                 .anyMatch(slot -> slot.getParticipant() != null && 
                                                  slot.getParticipant().getId().equals(userId)));
    }
    
    /**
     * Get the name of a participant by user ID
     */
    private String getParticipantName(Debate debate, String userId) {
        if (debate.getPositions() == null) {
            return "Unknown";
        }
        
        return debate.getPositions().stream()
                .flatMap(position -> position.getSlots().stream())
                .filter(slot -> slot.getParticipant() != null && 
                               slot.getParticipant().getId().equals(userId))
                .map(slot -> slot.getParticipant().getName())
                .findFirst()
                .orElse("Unknown");
    }
}

