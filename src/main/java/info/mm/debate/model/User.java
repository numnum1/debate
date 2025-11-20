package info.mm.debate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;        // Keycloak User-ID (sub claim)
    private String name;
    private String email;
    private String avatar;
}

