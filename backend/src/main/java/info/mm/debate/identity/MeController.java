package info.mm.debate.identity;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
class MeController {

	private final UserProfileService profiles;

	MeController(UserProfileService profiles) {
		this.profiles = profiles;
	}

	@GetMapping
	MeResponse me(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
		UserProfile profile = profiles.ensureProfile(jwt);
		List<String> roles = authentication.getAuthorities().stream()
			.map(GrantedAuthority::getAuthority)
			// Spring Security ergänzt eigene Authorities (z. B. FACTOR_BEARER); hier nur die Keycloak-Rollen
			.filter(authority -> authority.startsWith("ROLE_"))
			.map(authority -> authority.substring("ROLE_".length()))
			.toList();
		return new MeResponse(profile.id(), profile.username(), profile.displayName(), profile.email(), roles);
	}

	record MeResponse(String id, String username, String displayName, String email, List<String> roles) {
	}

}
