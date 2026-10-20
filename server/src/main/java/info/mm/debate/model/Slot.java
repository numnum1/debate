package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Slot {
    private String id;
    private SlotType type;
    private User participant;
    private AiConfig aiConfig;
    private Boolean invitationAccepted; // true wenn eingeladener Teilnehmer akzeptiert hat
    
    public enum SlotType {
        open,
        invited,
        ai
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiConfig {
        private String model;
        private String personality;
    }
}

