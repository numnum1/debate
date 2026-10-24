package info.mm.debate.identity;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Nur lokal: Legt die Profile der Testnutzer an, damit die Nutzersuche sofort Treffer liefert und nicht erst,
 * nachdem sich alle einmal angemeldet haben. IDs und Namen stehen in {@code infra/keycloak/debate-realm.json};
 * vorhandene Profile bleiben unangetastet.
 */
@Component
@Profile("dev")
class DevUserSeed implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DevUserSeed.class);

	private final UserProfileRepository repository;
	private final Clock clock = Clock.systemUTC();

	DevUserSeed(UserProfileRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(ApplicationArguments args) {
		Instant now = clock.instant();
		List<UserProfile> missing = users(now).stream().filter(user -> !repository.existsById(user.id())).toList();
		repository.saveAll(missing);
		if (!missing.isEmpty()) {
			log.info("Dev-Seed: {} Testnutzer-Profile angelegt", missing.size());
		}
	}

	static List<UserProfile> users(Instant now) {
		return List.of(
				user(now, 1, "admin", "Dev Admin"),
				user(now, 2, "alice", "Alice Arnold"),
				user(now, 3, "bob", "Bob Berger"),
				user(now, 4, "carol", "Carol Clausen"),
				user(now, 5, "dave", "Dave Dietrich"),
				user(now, 6, "erin", "Erin Engel"),
				user(now, 7, "frank", "Frank Fuchs"),
				user(now, 8, "grace", "Grace Graf"));
	}

	private static UserProfile user(Instant now, int number, String username, String displayName) {
		return new UserProfile("00000000-0000-4000-8000-%012d".formatted(number), username, displayName,
				username + "@debate.local", now, now);
	}

}
