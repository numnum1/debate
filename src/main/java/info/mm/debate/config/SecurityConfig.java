package info.mm.debate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Öffentliche Endpoints
                .requestMatchers("/api/public/**", "/actuator/health", "/actuator/info").permitAll()
                // WebSocket-Endpunkt (Authentifizierung erfolgt über Interceptor)
                .requestMatchers("/ws/**").permitAll()
                // Alle anderen Endpoints benötigen Authentifizierung
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // Standard Spring Security authorities
            JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();
            Collection<GrantedAuthority> authorities = defaultConverter.convert(jwt);
            
            // Keycloak Realm Roles
            Collection<GrantedAuthority> realmRoles = extractRealmRoles(jwt.getClaims());
            
            // Keycloak Resource Roles (Client Roles)
            Collection<GrantedAuthority> resourceRoles = extractResourceRoles(jwt.getClaims());
            
            // Alle Authorities kombinieren
            return Stream.of(authorities, realmRoles, resourceRoles)
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet());
        });
        
        return converter;
    }

    private Collection<GrantedAuthority> extractRealmRoles(Map<String, Object> claims) {
        Map<String, Object> realmAccess = (Map<String, Object>) claims.get("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    .collect(Collectors.toSet());
        }
        return List.of();
    }

    private Collection<GrantedAuthority> extractResourceRoles(Map<String, Object> claims) {
        Map<String, Object> resourceAccess = (Map<String, Object>) claims.get("resource_access");
        if (resourceAccess != null) {
            return resourceAccess.entrySet().stream()
                    .filter(entry -> entry.getValue() instanceof Map)
                    .flatMap(entry -> {
                        Map<String, Object> resource = (Map<String, Object>) entry.getValue();
                        if (resource.containsKey("roles")) {
                            List<String> roles = (List<String>) resource.get("roles");
                            String clientId = entry.getKey();
                            return roles.stream()
                                    .map(role -> new SimpleGrantedAuthority("ROLE_" + clientId + "_" + role.toUpperCase()));
                        }
                        return Stream.empty();
                    })
                    .collect(Collectors.toSet());
        }
        return List.of();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

