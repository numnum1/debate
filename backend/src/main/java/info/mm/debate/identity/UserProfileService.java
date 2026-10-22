package info.mm.debate.identity;

import java.time.Clock;
import java.time.Instant;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
class UserProfileService {

	private final UserProfileRepository repository;
	private final Clock clock = Clock.systemUTC();

	UserProfileService(UserProfileRepository repository) {
		this.repository = repository;
	}

	/**
	 * Legt beim ersten Aufruf ein Profil zum Keycloak-Nutzer an. Danach übernimmt es bei jedem Aufruf Name und
	 * E-Mail aus dem Token, damit Änderungen in Keycloak ankommen, und merkt sich den letzten Besuch.
	 */
	UserProfile ensureProfile(Jwt jwt) {
		Instant now = clock.instant();
		String username = jwt.getClaimAsString("preferred_username");
		String displayName = jwt.getClaimAsString("name");
		String email = jwt.getClaimAsString("email");
		UserProfile profile = repository.findById(jwt.getSubject())
			.map(existing -> existing.seenAt(now, username, displayName, email))
			.orElseGet(() -> new UserProfile(jwt.getSubject(), username, displayName, email, now, now));
		return repository.save(profile);
	}

}
