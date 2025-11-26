package info.mm.debate.service;

import info.mm.debate.model.User;
import info.mm.debate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    
    /**
     * Extrahiert User-Informationen aus dem Keycloak JWT Token
     * und cached den User in der Datenbank
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
        
        User user = User.builder()
                .id(userId)
                .name(name)
                .email(email)
                .build();
        
        // Cache user in database (upsert)
        cacheUser(user);
        
        return user;
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
    
    /**
     * Cached einen User in der Datenbank (für Suchfunktionalität)
     */
    public void cacheUser(User user) {
        try {
            // Check if user exists
            Optional<User> existingUser = userRepository.findById(user.getId());
            
            if (existingUser.isPresent()) {
                // Update existing user if data has changed
                User existing = existingUser.get();
                boolean nameChanged = !existing.getName().equals(user.getName());
                boolean emailChanged = !java.util.Objects.equals(existing.getEmail(), user.getEmail());
                
                if (nameChanged || emailChanged) {
                    // Preserve trustedRank when updating from JWT
                    user.setTrustedRank(existing.getTrustedRank());
                    userRepository.save(user);
                    log.debug("Updated cached user: {}", user.getId());
                }
            } else {
                // Save new user with default trustedRank "unknown"
                if (user.getTrustedRank() == null) {
                    user.setTrustedRank("unknown");
                }
                userRepository.save(user);
                log.debug("Cached new user: {}", user.getId());
            }
        } catch (Exception e) {
            log.error("Error caching user: {}", user.getId(), e);
        }
    }
    
    /**
     * Sucht nach Usern anhand des Namens (für Einladungen)
     */
    public List<User> searchUsers(String query) {
        log.debug("Searching users with query: {}", query);
        
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        
        return userRepository.findByNameContainingIgnoreCase(query.trim());
    }
    
    /**
     * Findet einen User anhand der ID
     */
    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }
    
    /**
     * Gibt alle gecachten User zurück
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * Synchronisiert alle User aus Keycloak in MongoDB
     */
    public int syncUsersFromKeycloak() {
        log.info("Starting user synchronization from Keycloak...");
        
        try {
            List<User> keycloakUsers = keycloakService.fetchAllUsers();
            
            if (keycloakUsers.isEmpty()) {
                log.warn("No users fetched from Keycloak");
                return 0;
            }
            
            log.info("Syncing {} users from Keycloak to MongoDB...", keycloakUsers.size());
            
            int synced = 0;
            for (User user : keycloakUsers) {
                try {
                    // Preserve existing trustedRank if user already exists
                    Optional<User> existingUser = userRepository.findById(user.getId());
                    if (existingUser.isPresent()) {
                        user.setTrustedRank(existingUser.get().getTrustedRank());
                    } else {
                        user.setTrustedRank("unknown");
                    }
                    
                    userRepository.save(user);
                    synced++;
                } catch (Exception e) {
                    log.error("Failed to save user {}: {}", user.getId(), e.getMessage());
                }
            }
            
            log.info("✓ Successfully synced {} users from Keycloak", synced);
            return synced;
        } catch (Exception e) {
            log.error("✗ Error during user synchronization: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * Aktualisiert den Vertrauens-Rang eines Users
     */
    public User updateTrustedRank(String userId, String trustedRank) {
        log.info("Updating trusted rank for user {} to {}", userId, trustedRank);
        
        // Validierung
        if (!trustedRank.equals("unknown") && !trustedRank.equals("trusted")) {
            throw new IllegalArgumentException("Invalid trusted rank. Must be 'unknown' or 'trusted'");
        }
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found: " + userId);
        }
        
        User user = userOpt.get();
        user.setTrustedRank(trustedRank);
        User savedUser = userRepository.save(user);
        
        log.info("✓ Updated trusted rank for user {} to {}", userId, trustedRank);
        return savedUser;
    }
    
    /**
     * Findet alle User mit einem bestimmten Vertrauens-Rang
     */
    public List<User> getUsersByTrustedRank(String trustedRank) {
        return userRepository.findByTrustedRank(trustedRank);
    }
}

