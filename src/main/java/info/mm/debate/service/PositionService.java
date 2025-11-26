package info.mm.debate.service;

import info.mm.debate.exception.DuplicateColorException;
import info.mm.debate.model.Debate;
import info.mm.debate.model.Position;
import info.mm.debate.model.Slot;
import info.mm.debate.repository.DebateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PositionService {
    
    private final DebateRepository debateRepository;
    private final ModeratorService moderatorService;
    private final JudgeService judgeService;
    
    /**
     * Validate that the color is not already used by another position
     */
    private void validateColorUniqueness(Debate debate, String color, String excludePositionId) {
        if (color == null || debate.getPositions() == null) {
            return;
        }
        
        boolean colorExists = debate.getPositions().stream()
                .filter(p -> excludePositionId == null || !p.getId().equals(excludePositionId))
                .anyMatch(p -> color.equalsIgnoreCase(p.getColor()));
        
        if (colorExists) {
            throw new DuplicateColorException("Die Farbe wird bereits von einer anderen Position verwendet");
        }
    }
    
    /**
     * Add a position to a debate
     */
    @Transactional
    public Optional<Position> addPosition(String debateId, Position position) {
        log.info("Adding position to debate: {}", debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Validate that the color is not already used
                    validateColorUniqueness(debate, position.getColor(), null);
                    
                    if (position.getId() == null || position.getId().isEmpty()) {
                        position.setId(UUID.randomUUID().toString());
                    }
                    
                    if (debate.getPositions() == null) {
                        debate.setPositions(new ArrayList<>());
                    }
                    debate.getPositions().add(position);
                    debate.setUpdatedAt(LocalDateTime.now());
                    
                    debateRepository.save(debate);
                    return position;
                });
    }
    
    /**
     * Update a position in a debate
     */
    @Transactional
    public Optional<Position> updatePosition(String debateId, String positionId, Position updatedPosition) {
        log.info("Updating position {} in debate {}", positionId, debateId);
        
        return debateRepository.findById(debateId)
                .flatMap(debate -> {
                    if (debate.getPositions() == null) {
                        return Optional.empty();
                    }
                    
                    // Validate color uniqueness if color is being updated
                    if (updatedPosition.getColor() != null) {
                        validateColorUniqueness(debate, updatedPosition.getColor(), positionId);
                    }
                    
                    return debate.getPositions().stream()
                            .filter(p -> p.getId().equals(positionId))
                            .findFirst()
                            .map(position -> {
                                if (updatedPosition.getName() != null) {
                                    position.setName(updatedPosition.getName());
                                }
                                if (updatedPosition.getDescription() != null) {
                                    position.setDescription(updatedPosition.getDescription());
                                }
                                if (updatedPosition.getColor() != null) {
                                    position.setColor(updatedPosition.getColor());
                                }
                                if (updatedPosition.getSlots() != null) {
                                    position.setSlots(updatedPosition.getSlots());
                                }
                                
                                debate.setUpdatedAt(LocalDateTime.now());
                                debateRepository.save(debate);
                                return position;
                            });
                });
    }
    
    /**
     * Delete a position from a debate
     */
    @Transactional
    public boolean deletePosition(String debateId, String positionId) {
        log.info("Deleting position {} from debate {}", positionId, debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    if (debate.getPositions() == null) {
                        return false;
                    }
                    
                    boolean removed = debate.getPositions().removeIf(p -> p.getId().equals(positionId));
                    if (removed) {
                        debate.setUpdatedAt(LocalDateTime.now());
                        debateRepository.save(debate);
                    }
                    return removed;
                })
                .orElse(false);
    }
    
    /**
     * Add a slot to a position
     */
    @Transactional
    public Optional<Slot> addSlot(String debateId, String positionId, Slot slot) {
        log.info("Adding slot to position {} in debate {}", positionId, debateId);
        
        // Validate that participant (if set) is not a moderator or judge
        if (slot.getParticipant() != null) {
            moderatorService.validateUserCanBeParticipant(debateId, slot.getParticipant().getId());
            judgeService.validateUserCanBeParticipant(debateId, slot.getParticipant().getId());
        }
        
        return debateRepository.findById(debateId)
                .flatMap(debate -> {
                    if (debate.getPositions() == null) {
                        return Optional.empty();
                    }
                    
                    // Owner selbst gilt automatisch als akzeptiert
                    if (slot.getType() == Slot.SlotType.invited && 
                        slot.getParticipant() != null && 
                        debate.getCreatedBy() != null &&
                        slot.getParticipant().getId().equals(debate.getCreatedBy().getId())) {
                        log.info("Owner invited themselves, automatically accepting");
                        slot.setInvitationAccepted(true);
                    }
                    
                    return debate.getPositions().stream()
                            .filter(p -> p.getId().equals(positionId))
                            .findFirst()
                            .map(position -> {
                                if (slot.getId() == null || slot.getId().isEmpty()) {
                                    slot.setId(UUID.randomUUID().toString());
                                }
                                
                                if (position.getSlots() == null) {
                                    position.setSlots(new ArrayList<>());
                                }
                                position.getSlots().add(slot);
                                
                                debate.setUpdatedAt(LocalDateTime.now());
                                debateRepository.save(debate);
                                return slot;
                            });
                });
    }
    
    /**
     * Check if all invited slots have been accepted and update debate status accordingly
     */
    private void checkAndUpdateDebateStatusAfterInvitations(Debate debate) {
        // Only check if debate is in awaiting_acceptance status
        if (debate.getStatus() != Debate.DebateStatus.awaiting_acceptance) {
            return;
        }
        
        // Check if there are any invited slots
        boolean hasInvitedSlots = debate.getPositions().stream()
                .flatMap(position -> position.getSlots().stream())
                .anyMatch(slot -> slot.getType() == Slot.SlotType.invited);
        
        if (!hasInvitedSlots) {
            // No invited slots anymore, go back to pending
            log.info("No invited slots left, changing debate {} status from awaiting_acceptance to pending", debate.getId());
            debate.setStatus(Debate.DebateStatus.pending);
            return;
        }
        
        // Check if all invited slots have been accepted
        boolean allInvitedAccepted = debate.getPositions().stream()
                .flatMap(position -> position.getSlots().stream())
                .filter(slot -> slot.getType() == Slot.SlotType.invited)
                .allMatch(slot -> Boolean.TRUE.equals(slot.getInvitationAccepted()));
        
        if (allInvitedAccepted) {
            log.info("All invited participants have accepted, changing debate {} status from awaiting_acceptance to pending", debate.getId());
            debate.setStatus(Debate.DebateStatus.pending);
        }
    }
    
    /**
     * Update a slot in a position
     */
    @Transactional
    public Optional<Slot> updateSlot(String debateId, String positionId, String slotId, Slot updatedSlot) {
        log.info("Updating slot {} in position {} in debate {}", slotId, positionId, debateId);
        
        // Validate that participant (if being updated) is not a moderator or judge
        if (updatedSlot.getParticipant() != null) {
            moderatorService.validateUserCanBeParticipant(debateId, updatedSlot.getParticipant().getId());
            judgeService.validateUserCanBeParticipant(debateId, updatedSlot.getParticipant().getId());
        }
        
        return debateRepository.findById(debateId)
                .flatMap(debate -> {
                    if (debate.getPositions() == null) {
                        return Optional.empty();
                    }
                    
                    return debate.getPositions().stream()
                            .filter(p -> p.getId().equals(positionId))
                            .findFirst()
                            .flatMap(position -> {
                                if (position.getSlots() == null) {
                                    return Optional.empty();
                                }
                                
                                return position.getSlots().stream()
                                        .filter(s -> s.getId().equals(slotId))
                                        .findFirst()
                                        .map(slot -> {
                                            if (updatedSlot.getType() != null) {
                                                slot.setType(updatedSlot.getType());
                                            }
                                            if (updatedSlot.getParticipant() != null) {
                                                slot.setParticipant(updatedSlot.getParticipant());
                                                
                                                // Owner selbst gilt automatisch als akzeptiert
                                                if (slot.getType() == Slot.SlotType.invited && 
                                                    debate.getCreatedBy() != null &&
                                                    updatedSlot.getParticipant().getId().equals(debate.getCreatedBy().getId())) {
                                                    log.info("Participant changed to owner, automatically accepting");
                                                    slot.setInvitationAccepted(true);
                                                }
                                            }
                                            if (updatedSlot.getAiConfig() != null) {
                                                slot.setAiConfig(updatedSlot.getAiConfig());
                                            }
                                            if (updatedSlot.getInvitationAccepted() != null) {
                                                slot.setInvitationAccepted(updatedSlot.getInvitationAccepted());
                                            }
                                            
                                            // Check if all invitations are now accepted and update status accordingly
                                            checkAndUpdateDebateStatusAfterInvitations(debate);
                                            
                                            debate.setUpdatedAt(LocalDateTime.now());
                                            debateRepository.save(debate);
                                            return slot;
                                        });
                            });
                });
    }
    
    /**
     * Delete a slot from a position
     */
    @Transactional
    public boolean deleteSlot(String debateId, String positionId, String slotId) {
        log.info("Deleting slot {} from position {} in debate {}", slotId, positionId, debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    if (debate.getPositions() == null) {
                        return false;
                    }
                    
                    return debate.getPositions().stream()
                            .filter(p -> p.getId().equals(positionId))
                            .findFirst()
                            .map(position -> {
                                if (position.getSlots() == null) {
                                    return false;
                                }
                                
                                boolean removed = position.getSlots().removeIf(s -> s.getId().equals(slotId));
                                if (removed) {
                                    // Check if all invitations are now accepted after removing this slot
                                    checkAndUpdateDebateStatusAfterInvitations(debate);
                                    
                                    debate.setUpdatedAt(LocalDateTime.now());
                                    debateRepository.save(debate);
                                }
                                return removed;
                            })
                            .orElse(false);
                })
                .orElse(false);
    }
}

