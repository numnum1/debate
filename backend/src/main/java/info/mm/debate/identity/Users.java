package info.mm.debate.identity;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

/**
 * Öffentliche Schnittstelle des Moduls für andere Module, z. B. die Rollenvergabe beim Anlegen einer Debatte.
 * Bekannt sind nur Nutzer, die sich schon einmal angemeldet haben; ihr Profil entsteht erst bei {@code /api/me}.
 */
@Service
public class Users {

	static final int MIN_QUERY_LENGTH = 2;

	private final UserProfileRepository repository;

	Users(UserProfileRepository repository) {
		this.repository = repository;
	}

	/** Nutzer, deren Nutzername oder Anzeigename die Eingabe enthält; höchstens zehn, ohne E-Mail. */
	public List<Found> search(String query) {
		String term = query == null ? "" : query.strip();
		if (term.length() < MIN_QUERY_LENGTH) {
			return List.of();
		}
		return repository.findTop10ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(term, term).stream()
			.map(profile -> new Found(profile.id(), profile.username(), profile.displayName()))
			.toList();
	}

	/** Ob es zu jeder dieser IDs einen bekannten Nutzer gibt. */
	public boolean existAll(Collection<String> ids) {
		Set<String> distinct = Set.copyOf(ids);
		long found = repository.findAllById(distinct).stream().map(UserProfile::id).collect(Collectors.toSet()).size();
		return found == distinct.size();
	}

	/** @param id Keycloak-{@code sub} */
	public record Found(String id, String username, String displayName) {
	}

}
