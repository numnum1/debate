package info.mm.debate.service;

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
    
    /**
     * Add a position to a debate
     */
    @Transactional
    public Optional<Position> addPosition(String debateId, Position position) {
        log.info("Adding position to debate: {}", debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
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
        
        // Validate that participant (if set) is not a moderator
        if (slot.getParticipant() != null) {
            moderatorService.validateUserCanBeParticipant(debateId, slot.getParticipant().getId());
        }
        
        return debateRepository.findById(debateId)
                .flatMap(debate -> {
                    if (debate.getPositions() == null) {
                        return Optional.empty();
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
     * Update a slot in a position
     */
    @Transactional
    public Optional<Slot> updateSlot(String debateId, String positionId, String slotId, Slot updatedSlot) {
        log.info("Updating slot {} in position {} in debate {}", slotId, positionId, debateId);
        
        // Validate that participant (if being updated) is not a moderator
        if (updatedSlot.getParticipant() != null) {
            moderatorService.validateUserCanBeParticipant(debateId, updatedSlot.getParticipant().getId());
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
                                            }
                                            if (updatedSlot.getAiConfig() != null) {
                                                slot.setAiConfig(updatedSlot.getAiConfig());
                                            }
                                            
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

