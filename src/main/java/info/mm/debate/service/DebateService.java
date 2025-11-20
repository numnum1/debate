package info.mm.debate.service;

import info.mm.debate.model.Debate;
import info.mm.debate.repository.DebateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        return debateRepository.findByCreatorId(creatorId);
    }
    
    public List<Debate> getDebatesByStatus(Debate.DebateStatus status) {
        log.debug("Fetching debates with status: {}", status);
        return debateRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public List<Debate> getDebatesByParticipant(String userId) {
        log.debug("Fetching debates for participant: {}", userId);
        return debateRepository.findByParticipantIdsContaining(userId);
    }
    
    public List<Debate> searchDebatesByTitle(String title) {
        log.debug("Searching debates with title containing: {}", title);
        return debateRepository.findByTitleContainingIgnoreCase(title);
    }
    
    @Transactional
    public Debate createDebate(Debate debate, String creatorId) {
        log.info("Creating new debate: {}", debate.getTitle());
        debate.setId(null); // Ensure new ID is generated
        debate.setCreatorId(creatorId);
        debate.setCreatedAt(LocalDateTime.now());
        debate.setUpdatedAt(LocalDateTime.now());
        if (debate.getStatus() == null) {
            debate.setStatus(Debate.DebateStatus.DRAFT);
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
                        existingDebate.setStatus(updatedDebate.getStatus());
                    }
                    if (updatedDebate.getParticipantIds() != null) {
                        existingDebate.setParticipantIds(updatedDebate.getParticipantIds());
                    }
                    if (updatedDebate.getArguments() != null) {
                        existingDebate.setArguments(updatedDebate.getArguments());
                    }
                    existingDebate.setUpdatedAt(LocalDateTime.now());
                    return debateRepository.save(existingDebate);
                });
    }
    
    @Transactional
    public Optional<Debate> addArgument(String debateId, Debate.Argument argument, String userId) {
        log.info("Adding argument to debate: {}", debateId);
        return debateRepository.findById(debateId)
                .map(debate -> {
                    argument.setId(UUID.randomUUID().toString());
                    argument.setUserId(userId);
                    argument.setCreatedAt(LocalDateTime.now());
                    
                    List<Debate.Argument> arguments = debate.getArguments();
                    if (arguments == null) {
                        arguments = List.of(argument);
                    } else {
                        arguments.add(argument);
                    }
                    debate.setArguments(arguments);
                    debate.setUpdatedAt(LocalDateTime.now());
                    return debateRepository.save(debate);
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
}

