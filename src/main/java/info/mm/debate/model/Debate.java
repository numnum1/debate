package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "debates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Debate {
    
    @Id
    private String id;
    
    private String title;
    
    private String description;
    
    private User createdBy; // Changed from creatorId to full User object
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private DebateStatus status;
    
    private Boolean isPublic; // true = public, false = private
    
    private List<Position> positions;
    
    private List<DebateMessage> messages;
    
    private List<String> tags;
    
    private List<User> moderators; // Moderatoren der Debatte (dürfen keine Position vertreten)
    
    private List<User> judges; // Juroren der Debatte (bewerten Argumente)
    
    private List<Evaluation> evaluations; // Bewertungen der Juroren
    
    public enum DebateStatus {
        pending,   // Frontend expects lowercase
        awaiting_acceptance,  // Waiting for invited participants to accept
        active,
        completed,
        archived   // Debate is closed and archived
    }
}


