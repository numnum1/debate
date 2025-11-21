package info.mm.debate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/**
 * Service to automatically sync users from Keycloak on application startup
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {
    
    private final UserService userService;
    
    /**
     * Automatically sync users from Keycloak when application starts
     */
    @EventListener(ApplicationReadyEvent.class)
    public void syncUsersOnStartup() {
        log.info("=".repeat(60));
        log.info("Application ready - starting automatic user synchronization...");
        log.info("=".repeat(60));
        
        try {
            int count = userService.syncUsersFromKeycloak();
            
            if (count > 0) {
                log.info("=".repeat(60));
                log.info("✓ User synchronization completed: {} users synced", count);
                log.info("=".repeat(60));
            } else {
                log.warn("=".repeat(60));
                log.warn("⚠ No users synchronized from Keycloak");
                log.warn("Please check Keycloak connection settings");
                log.warn("=".repeat(60));
            }
        } catch (Exception e) {
            log.error("=".repeat(60));
            log.error("✗ Error during automatic user synchronization: {}", e.getMessage());
            log.error("=".repeat(60));
        }
    }
}

