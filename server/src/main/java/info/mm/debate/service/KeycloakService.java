package info.mm.debate.service;

import info.mm.debate.model.User;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class KeycloakService {
    
    @Value("${keycloak.server-url}")
    private String serverUrl;
    
    @Value("${keycloak.realm}")
    private String realm;
    
    @Value("${keycloak.admin-client-id}")
    private String adminClientId;
    
    @Value("${keycloak.admin-username}")
    private String adminUsername;
    
    @Value("${keycloak.admin-password}")
    private String adminPassword;
    
    private Keycloak keycloak;
    
    @PostConstruct
    public void init() {
        try {
            log.info("Initializing Keycloak Admin Client...");
            log.debug("Server URL: {}, Realm: {}", serverUrl, realm);
            
            this.keycloak = KeycloakBuilder.builder()
                    .serverUrl(serverUrl)
                    .realm("master") // Admin client uses master realm
                    .clientId(adminClientId)
                    .username(adminUsername)
                    .password(adminPassword)
                    .build();
            
            // Test connection
            keycloak.serverInfo().getInfo();
            log.info("✓ Keycloak Admin Client successfully connected");
        } catch (Exception e) {
            log.error("✗ Failed to initialize Keycloak Admin Client: {}", e.getMessage());
            log.warn("User synchronization from Keycloak will not be available");
        }
    }
    
    /**
     * Fetch all users from Keycloak
     */
    public List<User> fetchAllUsers() {
        if (keycloak == null) {
            log.warn("Keycloak Admin Client not initialized");
            return List.of();
        }
        
        try {
            log.info("Fetching all users from Keycloak realm: {}", realm);
            
            List<UserRepresentation> keycloakUsers = keycloak.realm(realm)
                    .users()
                    .list();
            
            log.info("✓ Fetched {} users from Keycloak", keycloakUsers.size());
            
            // Convert to our User model
            List<User> users = keycloakUsers.stream()
                    .map(this::convertToUser)
                    .collect(Collectors.toList());
            
            return users;
        } catch (Exception e) {
            log.error("✗ Error fetching users from Keycloak: {}", e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Search users in Keycloak by name
     */
    public List<User> searchUsers(String query) {
        if (keycloak == null) {
            log.warn("Keycloak Admin Client not initialized");
            return List.of();
        }
        
        try {
            log.debug("Searching Keycloak users with query: {}", query);
            
            List<UserRepresentation> keycloakUsers = keycloak.realm(realm)
                    .users()
                    .search(query, 0, 50); // Max 50 results
            
            log.debug("Found {} users in Keycloak matching '{}'", keycloakUsers.size(), query);
            
            return keycloakUsers.stream()
                    .map(this::convertToUser)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error searching users in Keycloak: {}", e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Convert Keycloak UserRepresentation to our User model
     */
    private User convertToUser(UserRepresentation keycloakUser) {
        return User.builder()
                .id(keycloakUser.getId())
                .name(getName(keycloakUser))
                .email(keycloakUser.getEmail())
                .build();
    }
    
    /**
     * Extract name from Keycloak user
     */
    private String getName(UserRepresentation keycloakUser) {
        // Try firstName + lastName
        if (keycloakUser.getFirstName() != null && keycloakUser.getLastName() != null) {
            return keycloakUser.getFirstName() + " " + keycloakUser.getLastName();
        }
        
        // Try firstName only
        if (keycloakUser.getFirstName() != null) {
            return keycloakUser.getFirstName();
        }
        
        // Try lastName only
        if (keycloakUser.getLastName() != null) {
            return keycloakUser.getLastName();
        }
        
        // Fallback to username
        if (keycloakUser.getUsername() != null) {
            return keycloakUser.getUsername();
        }
        
        // Fallback to email
        if (keycloakUser.getEmail() != null) {
            return keycloakUser.getEmail();
        }
        
        // Last resort
        return "User " + keycloakUser.getId();
    }
}

