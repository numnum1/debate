package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    
    @Builder.Default
    private List<Position> positions = new ArrayList<>();
    
    @Builder.Default
    private List<DebateMessage> messages = new ArrayList<>();
    
    public enum DebateStatus {
        pending,   // Frontend expects lowercase
        active,
        completed,
        archived   // Debate is closed and archived
    }
}


