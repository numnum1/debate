package info.mm.debate.identity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * App-Profil eines Nutzers. Die ID ist das Keycloak-"sub"; Login, Passwort und globale Rollen bleiben in Keycloak.
 */
@Document("users")
record UserProfile(
		@Id String id,
		String username,
		String displayName,
		String email,
		Instant createdAt,
		Instant lastSeenAt) {

	/** Übernimmt Name und E-Mail aus Keycloak, das dafür die Quelle bleibt, und merkt sich den Besuch. */
	UserProfile seenAt(Instant now, String username, String displayName, String email) {
		return new UserProfile(id, username, displayName, email, createdAt, now);
	}

}
