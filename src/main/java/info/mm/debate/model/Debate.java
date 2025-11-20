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
    
    private String creatorId;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private DebateStatus status;
    
    private List<String> participantIds;
    
    private List<Argument> arguments;
    
    public enum DebateStatus {
        DRAFT,
        OPEN,
        CLOSED,
        ARCHIVED
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Argument {
        private String id;
        private String userId;
        private String content;
        private ArgumentType type;
        private LocalDateTime createdAt;
        private List<String> supportingEvidences;
        
        public enum ArgumentType {
            PRO,
            CONTRA,
            NEUTRAL
        }
    }
}

