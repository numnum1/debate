package info.mm.debate.service;

import info.mm.debate.model.Debate;
import info.mm.debate.model.DebateMessage;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    
    private final DebateRepository debateRepository;
    private final ModeratorService moderatorService;
    
    /**
     * Get all messages for a debate
     */
    public Optional<List<DebateMessage>> getMessagesByDebateId(String debateId) {
        log.debug("Fetching messages for debate: {}", debateId);
        return debateRepository.findById(debateId)
                .map(Debate::getMessages);
    }
    
    /**
     * Add a message to a debate
     */
    @Transactional
    public Optional<DebateMessage> addMessageToDebate(String debateId, DebateMessage message) {
        log.info("Adding message to debate: {}", debateId);
        
        return debateRepository.findById(debateId)
                .map(debate -> {
                    // Generate ID and timestamp if not set
                    if (message.getId() == null || message.getId().isEmpty()) {
                        message.setId(UUID.randomUUID().toString());
                    }
                    if (message.getTimestamp() == null) {
                        message.setTimestamp(LocalDateTime.now());
                    }
                    
                    // Check if user is a moderator and set flag
                    boolean isModerator = moderatorService.isModerator(debateId, message.getUserId());
                    message.setIsModerator(isModerator);
                    
                    // If user is a moderator, clear position and slot IDs
                    if (isModerator) {
                        message.setPositionId(null);
                        message.setSlotId(null);
                        log.debug("Message is from moderator, clearing position/slot IDs");
                    }
                    
                    // Add message to debate
                    List<DebateMessage> messages = debate.getMessages();
                    if (messages == null) {
                        messages = new ArrayList<>();
                        debate.setMessages(messages);
                    }
                    messages.add(message);
                    
                    debate.setUpdatedAt(LocalDateTime.now());
                    debateRepository.save(debate);
                    
                    log.debug("Message added successfully: {} (moderator: {})", message.getId(), isModerator);
                    return message;
                });
    }
}

