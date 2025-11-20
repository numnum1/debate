package info.mm.debate.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/public")
@Slf4j
public class PublicController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        log.debug("GET /public/health - Health check");
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "service", "debate-server"
        ));
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> info() {
        log.debug("GET /public/info - Info endpoint");
        return ResponseEntity.ok(Map.of(
                "application", "Debate Server",
                "version", "1.0.0",
                "description", "Spring Boot server with Keycloak and MongoDB"
        ));
    }
}

