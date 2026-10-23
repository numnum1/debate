package info.mm.debate.debate;

import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
class DebateController {

	private final Debates debates;
	private final Clock clock = Clock.systemUTC();

	DebateController(Debates debates) {
		this.debates = debates;
	}

	/** Alle Debatten, auch ohne Anmeldung. */
	@GetMapping("/api/debates")
	List<DebateResponse> all() {
		Instant now = clock.instant();
		return debates.all().stream()
			.sorted(Comparator.comparing(Debate::startsAt))
			.map(debate -> DebateResponse.of(debate, now))
			.toList();
	}

	@GetMapping("/api/debates/{id}")
	DebateResponse one(@PathVariable String id) {
		return debates.find(id)
			.map(debate -> DebateResponse.of(debate, clock.instant()))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	/** Die Debatten, in denen der angemeldete Nutzer eine Rolle hat, mit diesen Rollen. */
	@GetMapping("/api/me/debates")
	List<MyRoles> mine(@AuthenticationPrincipal Jwt jwt) {
		return debates.withRolesFor(jwt.getSubject()).stream()
			.map(debate -> new MyRoles(debate.id(), debate.rolesOf(jwt.getSubject())))
			.toList();
	}

	record DebateResponse(
			String id,
			String topic,
			String sideA,
			String sideB,
			String category,
			Platform platform,
			DebateStatus status,
			Instant startsAt,
			Instant bettingClosesAt) {

		static DebateResponse of(Debate debate, Instant now) {
			return new DebateResponse(debate.id(), debate.topic(), debate.sideA(), debate.sideB(), debate.category(),
					debate.platform(), debate.statusAt(now), debate.startsAt(), debate.bettingClosesAt());
		}

	}

	record MyRoles(String debateId, Set<DebateRole> roles) {
	}

}
