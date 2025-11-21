package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.Position;
import info.mm.debate.model.Slot;
import info.mm.debate.service.DebateService;
import info.mm.debate.service.PositionService;
import info.mm.debate.websocket.DebateWebSocketHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/debates/{debateId}/positions")
@RequiredArgsConstructor
@Slf4j
public class PositionController {
    
    private final PositionService positionService;
    private final DebateService debateService;
    private final DebateWebSocketHandler webSocketHandler;
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Position>> addPosition(
            @PathVariable String debateId,
            @Valid @RequestBody Position position) {
        log.info("POST /debates/{}/positions - Adding position", debateId);
        
        return positionService.addPosition(debateId, position)
                .map(savedPosition -> {
                    // Broadcast debate update via WebSocket
                    debateService.getDebateById(debateId).ifPresent(debate -> 
                        webSocketHandler.broadcastDebateUpdate(debateId, debate)
                    );
                    
                    return ResponseEntity.status(HttpStatus.CREATED)
                            .body(ApiResponse.success(savedPosition, "Position added successfully"));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Debate not found")));
    }
    
    @PutMapping("/{positionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Position>> updatePosition(
            @PathVariable String debateId,
            @PathVariable String positionId,
            @Valid @RequestBody Position position) {
        log.info("PUT /debates/{}/positions/{} - Updating position", debateId, positionId);
        
        return positionService.updatePosition(debateId, positionId, position)
                .map(updatedPosition -> {
                    // Broadcast debate update via WebSocket
                    debateService.getDebateById(debateId).ifPresent(debate -> 
                        webSocketHandler.broadcastDebateUpdate(debateId, debate)
                    );
                    
                    return ResponseEntity.ok(
                            ApiResponse.success(updatedPosition, "Position updated successfully"));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Position or debate not found")));
    }
    
    @DeleteMapping("/{positionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePosition(
            @PathVariable String debateId,
            @PathVariable String positionId) {
        log.info("DELETE /debates/{}/positions/{} - Deleting position", debateId, positionId);
        
        boolean deleted = positionService.deletePosition(debateId, positionId);
        if (deleted) {
            // Broadcast debate update via WebSocket
            debateService.getDebateById(debateId).ifPresent(debate -> 
                webSocketHandler.broadcastDebateUpdate(debateId, debate)
            );
            
            return ResponseEntity.ok(ApiResponse.success(null, "Position deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Position or debate not found"));
    }
    
    // Slot endpoints
    @PostMapping("/{positionId}/slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Slot>> addSlot(
            @PathVariable String debateId,
            @PathVariable String positionId,
            @Valid @RequestBody Slot slot) {
        log.info("POST /debates/{}/positions/{}/slots - Adding slot", debateId, positionId);
        
        return positionService.addSlot(debateId, positionId, slot)
                .map(savedSlot -> {
                    // Broadcast debate update via WebSocket
                    debateService.getDebateById(debateId).ifPresent(debate -> 
                        webSocketHandler.broadcastDebateUpdate(debateId, debate)
                    );
                    
                    return ResponseEntity.status(HttpStatus.CREATED)
                            .body(ApiResponse.success(savedSlot, "Slot added successfully"));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Position or debate not found")));
    }
    
    @PutMapping("/{positionId}/slots/{slotId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Slot>> updateSlot(
            @PathVariable String debateId,
            @PathVariable String positionId,
            @PathVariable String slotId,
            @Valid @RequestBody Slot slot) {
        log.info("PUT /debates/{}/positions/{}/slots/{} - Updating slot", debateId, positionId, slotId);
        
        return positionService.updateSlot(debateId, positionId, slotId, slot)
                .map(updatedSlot -> {
                    // Broadcast debate update via WebSocket
                    debateService.getDebateById(debateId).ifPresent(debate -> 
                        webSocketHandler.broadcastDebateUpdate(debateId, debate)
                    );
                    
                    return ResponseEntity.ok(
                            ApiResponse.success(updatedSlot, "Slot updated successfully"));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Slot, position or debate not found")));
    }
    
    @DeleteMapping("/{positionId}/slots/{slotId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(
            @PathVariable String debateId,
            @PathVariable String positionId,
            @PathVariable String slotId) {
        log.info("DELETE /debates/{}/positions/{}/slots/{} - Deleting slot", debateId, positionId, slotId);
        
        boolean deleted = positionService.deleteSlot(debateId, positionId, slotId);
        if (deleted) {
            // Broadcast debate update via WebSocket
            debateService.getDebateById(debateId).ifPresent(debate -> 
                webSocketHandler.broadcastDebateUpdate(debateId, debate)
            );
            
            return ResponseEntity.ok(ApiResponse.success(null, "Slot deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Slot, position or debate not found"));
    }
}

