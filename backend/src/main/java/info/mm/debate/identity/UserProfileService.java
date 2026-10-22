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

	/** Legt beim ersten Aufruf ein Profil zum Keycloak-Nutzer an und merkt sich danach den letzten Besuch. */
	UserProfile ensureProfile(Jwt jwt) {
		Instant now = clock.instant();
		UserProfile profile = repository.findById(jwt.getSubject())
			.map(existing -> existing.seenAt(now))
			.orElseGet(() -> new UserProfile(
				jwt.getSubject(),
				jwt.getClaimAsString("preferred_username"),
				jwt.getClaimAsString("name"),
				jwt.getClaimAsString("email"),
				now,
				now));
		return repository.save(profile);
	}

}
