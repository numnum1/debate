package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebateMessage {
    private String id;
    private String userId;
    private String userName;
    private String text;
    private LocalDateTime timestamp;
    private String positionId;
    private String slotId;
}

