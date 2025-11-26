package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents an evaluation/rating given by a judge for arguments in a debate
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Evaluation {
    
    private String id;
    
    private String debateId;
    
    private String judgeId;
    
    private String judgeName;
    
    private String messageId; // Optional: reference to a specific message being evaluated
    
    private String title; // Short title for the evaluation
    
    private Integer points; // Points awarded (e.g., 1-10)
    
    private String comment; // Detailed evaluation comment
    
    private LocalDateTime timestamp;
    
    private String positionId; // Optional: which position is being evaluated
}

