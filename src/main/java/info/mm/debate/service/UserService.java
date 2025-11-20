package info.mm.debate.service;

import info.mm.debate.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    /**
     * Extrahiert User-Informationen aus dem Keycloak JWT Token
     */
    public User getUserFromJwt(Jwt jwt) {
        String userId = jwt.getSubject();
        String name = jwt.getClaimAsString("name");
        String email = jwt.getClaimAsString("email");
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        
        // Fallback to preferred_username if name is not available
        if (name == null || name.isEmpty()) {
            name = preferredUsername != null ? preferredUsername : userId;
        }
        
        log.debug("Extracted user from JWT: id={}, name={}, email={}", userId, name, email);
        
        return User.builder()
                .id(userId)
                .name(name)
                .email(email)
                .build();
    }
    
    /**
     * Erstellt ein User-Objekt aus userId und Name
     * (für Fälle wo wir nur die ID haben)
     */
    public User createUser(String userId, String userName, String email) {
        return User.builder()
                .id(userId)
                .name(userName)
                .email(email)
                .build();
    }
}

