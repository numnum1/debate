package info.mm.debate.service;

import info.mm.debate.exception.UnauthorizedException;
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
public class DebateService {
    
    private final DebateRepository debateRepository;
    
    public List<Debate> getAllDebates() {
        log.debug("Fetching all debates");
        return debateRepository.findAll();
    }
    
    public List<Debate> getPublicDebates() {
        log.debug("Fetching all public debates");
        return debateRepository.findByIsPublicOrderByCreatedAtDesc(true);
    }
    
    public List<Debate> getPublicDebatesByStatus(Debate.DebateStatus status) {
        log.debug("Fetching public debates with status: {}", status);
        return debateRepository.findByIsPublicAndStatusOrderByCreatedAtDesc(true, status);
    }
    
    public Optional<Debate> getDebateById(String id) {
        log.debug("Fetching debate with id: {}", id);
        return debateRepository.findById(id);
    }
    
    public List<Debate> getDebatesByCreator(String creatorId) {
        log.debug("Fetching debates for creator: {}", creatorId);
        // Note: We need to query by createdBy.id
        return debateRepository.findAll().stream()
                .filter(d -> d.getCreatedBy() != null && d.getCreatedBy().getId().equals(creatorId))
                .toList();
    }
    
    public List<Debate> getDebatesByStatus(Debate.DebateStatus status) {
        log.debug("Fetching debates with status: {}", status);
        return debateRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public List<Debate> searchDebatesByTitle(String title) {
        log.debug("Searching debates with title containing: {}", title);
        return debateRepository.findByTitleContainingIgnoreCase(title);
    }
    
    @Transactional
    public Debate createDebate(Debate debate, User creator) {
        log.info("Creating new debate: {}", debate.getTitle());
        debate.setId(null); // Ensure new ID is generated
        debate.setCreatedBy(creator);
        debate.setCreatedAt(LocalDateTime.now());
        debate.setUpdatedAt(LocalDateTime.now());
        
        if (debate.getStatus() == null) {
            debate.setStatus(Debate.DebateStatus.pending);
        }
        
        // Default to public if not specified
        if (debate.getIsPublic() == null) {
            debate.setIsPublic(true);
        }
        
        if (debate.getPositions() == null) {
            debate.setPositions(new ArrayList<>());
        }
        
        if (debate.getMessages() == null) {
            debate.setMessages(new ArrayList<>());
        }
        
        if (debate.getTags() == null) {
            debate.setTags(new ArrayList<>());
        }
        
        return debateRepository.save(debate);
    }
    
    @Transactional
    public Optional<Debate> updateDebate(String id, Debate updatedDebate, String userId) {
        log.info("User {} attempting to update debate with id: {}", userId, id);
        return debateRepository.findById(id)
                .map(existingDebate -> {
                    // Check if user is the owner (nur Owner darf Debatte ändern)
                    if (existingDebate.getCreatedBy() == null || !existingDebate.getCreatedBy().getId().equals(userId)) {
                        log.warn("User {} attempted to update debate {} but is not the owner", userId, id);
                        throw new UnauthorizedException("Nur der Ersteller der Debatte kann diese bearbeiten");
                    }
                    
                    if (updatedDebate.getTitle() != null) {
                        existingDebate.setTitle(updatedDebate.getTitle());
                    }
                    if (updatedDebate.getDescription() != null) {
                        existingDebate.setDescription(updatedDebate.getDescription());
                    }
                    if (updatedDebate.getStatus() != null) {
                        // Validate: Cannot start debate without at least 2 positions
                        if (updatedDebate.getStatus() == Debate.DebateStatus.active || 
                            updatedDebate.getStatus() == Debate.DebateStatus.awaiting_acceptance) {
                            if (existingDebate.getPositions() == null || existingDebate.getPositions().size() < 2) {
                                log.warn("Cannot start debate {}: Need at least 2 positions (found: {})", 
                                        id, existingDebate.getPositions() == null ? 0 : existingDebate.getPositions().size());
                                throw new IllegalStateException("Eine Debatte benötigt mindestens 2 Positionen, um gestartet zu werden");
                            }
                            
                            // Validate: Each position must have at least one slot
                            for (var position : existingDebate.getPositions()) {
                                if (position.getSlots() == null || position.getSlots().isEmpty()) {
                                    log.warn("Cannot start debate {}: Position '{}' has no slots", id, position.getName());
                                    throw new IllegalStateException("Jede Position muss mindestens einen Slot haben, um die Debatte zu starten");
                                }
                            }
                            
                            // Prüfe ob es eingeladene Teilnehmer gibt
                            boolean hasInvitedSlots = existingDebate.getPositions().stream()
                                .flatMap(position -> position.getSlots().stream())
                                .anyMatch(slot -> slot.getType() == info.mm.debate.model.Slot.SlotType.invited);
                            
                            if (updatedDebate.getStatus() == Debate.DebateStatus.active) {
                                // Wenn auf active gesetzt wird und es eingeladene Slots gibt
                                if (hasInvitedSlots) {
                                    // Prüfe ob alle eingeladenen akzeptiert haben
                                    boolean allInvitedAccepted = existingDebate.getPositions().stream()
                                        .flatMap(position -> position.getSlots().stream())
                                        .filter(slot -> slot.getType() == info.mm.debate.model.Slot.SlotType.invited)
                                        .allMatch(slot -> Boolean.TRUE.equals(slot.getInvitationAccepted()));
                                    
                                    if (!allInvitedAccepted) {
                                        log.warn("Cannot start debate {}: Not all invited participants have accepted", id);
                                        throw new IllegalStateException("Alle eingeladenen Teilnehmer müssen die Einladung akzeptiert haben, bevor die Debatte gestartet werden kann");
                                    }
                                }
                            }
                        }
                        existingDebate.setStatus(updatedDebate.getStatus());
                    }
                    if (updatedDebate.getIsPublic() != null) {
                        existingDebate.setIsPublic(updatedDebate.getIsPublic());
                    }
                    // Nur Positionen überschreiben, wenn explizit mitgesendet
                    // WICHTIG: Leere Arrays werden NICHT ignoriert - wenn bewusst gelöscht werden soll
                    if (updatedDebate.getPositions() != null) {
                        existingDebate.setPositions(updatedDebate.getPositions());
                    }
                    // Nur Messages überschreiben, wenn explizit mitgesendet  
                    if (updatedDebate.getMessages() != null) {
                        existingDebate.setMessages(updatedDebate.getMessages());
                    }
                    existingDebate.setUpdatedAt(LocalDateTime.now());
                    return debateRepository.save(existingDebate);
                });
    }
    
    @Transactional
    public boolean deleteDebate(String id, String userId) {
        log.info("User {} attempting to delete debate with id: {}", userId, id);
        
        Debate debate = debateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Debate not found with id: " + id));
        
        // Check if user is the owner (nur Owner darf Debatte löschen)
        if (debate.getCreatedBy() == null || !debate.getCreatedBy().getId().equals(userId)) {
            log.warn("User {} attempted to delete debate {} but is not the owner", userId, id);
            throw new UnauthorizedException("Nur der Ersteller der Debatte kann diese löschen");
        }
        
        debateRepository.deleteById(id);
        log.info("Debate {} successfully deleted by owner {}", id, userId);
        return true;
    }
    
    public long countDebatesByStatus(Debate.DebateStatus status) {
        return debateRepository.countByStatus(status);
    }
    
    /**
     * Closes a debate and archives it. Only the owner (creator) of the debate can close it.
     * 
     * @param debateId The ID of the debate to close
     * @param userId The ID of the user attempting to close the debate
     * @return The updated debate with archived status
     * @throws UnauthorizedException if the user is not the owner of the debate
     * @throws IllegalArgumentException if the debate is not found
     */
    @Transactional
    public Debate closeDebate(String debateId, String userId) {
        log.info("User {} attempting to close debate {}", userId, debateId);
        
        Debate debate = debateRepository.findById(debateId)
                .orElseThrow(() -> new IllegalArgumentException("Debate not found with id: " + debateId));
        
        // Check if user is the owner
        if (debate.getCreatedBy() == null || !debate.getCreatedBy().getId().equals(userId)) {
            log.warn("User {} attempted to close debate {} but is not the owner", userId, debateId);
            throw new UnauthorizedException("Nur der Ersteller der Debatte kann diese schließen");
        }
        
        // Check if debate is already archived
        if (debate.getStatus() == Debate.DebateStatus.archived) {
            log.info("Debate {} is already archived", debateId);
            return debate;
        }
        
        // Close and archive the debate
        debate.setStatus(Debate.DebateStatus.archived);
        debate.setUpdatedAt(LocalDateTime.now());
        
        Debate archivedDebate = debateRepository.save(debate);
        log.info("Debate {} successfully closed and archived by user {}", debateId, userId);
        
        return archivedDebate;
    }
}

