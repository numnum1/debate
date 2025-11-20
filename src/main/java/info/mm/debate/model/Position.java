package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Position {
    private String id;
    private String name;
    private String description;
    private String color; // Hex-Farbe, z.B. '#3b82f6'
    
    @Builder.Default
    private List<Slot> slots = new ArrayList<>();
}

