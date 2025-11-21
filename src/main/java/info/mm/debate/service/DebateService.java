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
        
        if (debate.getPositions() == null) {
            debate.setPositions(new ArrayList<>());
        }
        
        if (debate.getMessages() == null) {
            debate.setMessages(new ArrayList<>());
        }
        
        return debateRepository.save(debate);
    }
    
    @Transactional
    public Optional<Debate> updateDebate(String id, Debate updatedDebate) {
        log.info("Updating debate with id: {}", id);
        return debateRepository.findById(id)
                .map(existingDebate -> {
                    if (updatedDebate.getTitle() != null) {
                        existingDebate.setTitle(updatedDebate.getTitle());
                    }
                    if (updatedDebate.getDescription() != null) {
                        existingDebate.setDescription(updatedDebate.getDescription());
                    }
                    if (updatedDebate.getStatus() != null) {
                        // Validate: Cannot start debate without at least 2 positions
                        if (updatedDebate.getStatus() == Debate.DebateStatus.active) {
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
                        }
                        existingDebate.setStatus(updatedDebate.getStatus());
                    }
                    if (updatedDebate.getPositions() != null) {
                        existingDebate.setPositions(updatedDebate.getPositions());
                    }
                    if (updatedDebate.getMessages() != null) {
                        existingDebate.setMessages(updatedDebate.getMessages());
                    }
                    existingDebate.setUpdatedAt(LocalDateTime.now());
                    return debateRepository.save(existingDebate);
                });
    }
    
    @Transactional
    public boolean deleteDebate(String id) {
        log.info("Deleting debate with id: {}", id);
        if (debateRepository.existsById(id)) {
            debateRepository.deleteById(id);
            return true;
        }
        return false;
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

