package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.DebateMessage;
import info.mm.debate.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/debates/{debateId}/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {
    
    private final MessageService messageService;
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DebateMessage>>> getMessages(@PathVariable String debateId) {
        log.info("GET /debates/{}/messages - Fetching messages", debateId);
        
        return messageService.getMessagesByDebateId(debateId)
                .map(messages -> ResponseEntity.ok(ApiResponse.success(messages)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DebateMessage>> addMessage(
            @PathVariable String debateId,
            @Valid @RequestBody DebateMessage message) {
        log.info("POST /debates/{}/messages - Adding message", debateId);
        
        return messageService.addMessageToDebate(debateId, message)
                .map(savedMessage -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success(savedMessage, "Message added successfully")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
}

