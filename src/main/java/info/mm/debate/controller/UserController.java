package info.mm.debate.controller;

import info.mm.debate.dto.ApiResponse;
import info.mm.debate.model.User;
import info.mm.debate.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users", description = "User Management API - Benutzersuche und -verwaltung")
@SecurityRequirement(name = "bearerAuth")
public class UserController {
    
    private final UserService userService;
    
    @Operation(
            summary = "Aktuellen Benutzer abrufen",
            description = "Gibt die Informationen des aktuell eingeloggten Benutzers zurück"
    )
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        log.info("GET /users/me - Getting current user");
        User user = userService.getUserFromJwt(jwt);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
    
    @Operation(
            summary = "Benutzer suchen",
            description = "Sucht Benutzer anhand des Namens. Gibt eine Liste von passenden Benutzern zurück."
    )
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<User>>> searchUsers(
            @RequestParam String query,
            @AuthenticationPrincipal Jwt jwt) {
        
        log.info("GET /api/users/search?query={} - User: {}", query, jwt.getSubject());
        
        List<User> users = userService.searchUsers(query);
        log.info("✓ Found {} users matching query '{}': {}", users.size(), query, 
                users.stream().map(User::getName).toList());
        
        return ResponseEntity.ok(ApiResponse.success(users));
    }
    
    @Operation(
            summary = "Alle Benutzer abrufen",
            description = "Gibt eine Liste aller bekannten Benutzer zurück (nur gecachte User)"
    )
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        log.info("GET /users - Getting all users");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
    
    @Operation(
            summary = "Benutzer aus Keycloak synchronisieren",
            description = "Synchronisiert alle Benutzer aus Keycloak in die lokale Datenbank"
    )
    @PostMapping("/sync")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Integer>> syncUsersFromKeycloak() {
        log.info("POST /users/sync - Syncing users from Keycloak");
        int count = userService.syncUsersFromKeycloak();
        return ResponseEntity.ok(ApiResponse.success(count, count + " users synchronized from Keycloak"));
    }
}

