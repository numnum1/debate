package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;        // Keycloak User-ID (sub claim)
    private String name;
    private String email;
    private String avatar;
    
    // Trust-Level für Debate-Teilnehmer
    @Builder.Default
    private String trustedRank = "unknown";  // "unknown" oder "trusted"
}

