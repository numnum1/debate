package info.mm.debate.chat;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/** Angemeldeter Nutzer aus dem Keycloak-Token, für HTTP und WebSocket gleich. */
record ChatUser(String id, String name, boolean admin) {

	/** @return {@code null}, wenn niemand angemeldet ist */
	static ChatUser of(Principal principal) {
		if (!(principal instanceof JwtAuthenticationToken token)) {
			return null;
		}
		Jwt jwt = token.getToken();
		String name = jwt.getClaimAsString("name");
		if (name == null || name.isBlank()) {
			name = jwt.getClaimAsString("preferred_username");
		}
		return new ChatUser(jwt.getSubject(), name, hasRealmRole(jwt, "admin"));
	}

	private static boolean hasRealmRole(Jwt jwt, String role) {
		Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
		return realmAccess != null && realmAccess.get("roles") instanceof List<?> roles && roles.contains(role);
	}

}
