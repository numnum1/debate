package info.mm.debate.debate;

import java.net.URI;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import info.mm.debate.debate.Debate.RoleAssignment;

/**
 * Die Angaben des Hosts beim Anlegen einer Debatte. Der Host selbst steht nicht in {@code roles}, er ergibt sich
 * aus dem angemeldeten Nutzer; ohne Infrastruktur prüfbar, siehe {@link #validate(Instant, String)}.
 *
 * @param roles vergebene Rollen; erlaubt sind nur Juror, Moderator und Resolver
 */
record NewDebate(
		String topic,
		String sideA,
		String sideB,
		String category,
		Platform platform,
		String streamUrl,
		Instant startsAt,
		Instant bettingClosesAt,
		Ruleset ruleset,
		List<RoleAssignment> roles) {

	private static final Set<Integer> JURY_SIZES = Set.of(3, 5, 7);

	NewDebate {
		topic = clean(topic);
		sideA = clean(sideA);
		sideB = clean(sideB);
		category = clean(category);
		streamUrl = clean(streamUrl);
		roles = roles == null ? List.of() : List.copyOf(roles);
	}

	/**
	 * Wirft {@link DebateException}, wenn die Angaben nicht stimmen.
	 *
	 * @param hostId der Anleger, der selbst keine weitere Rolle bekommt
	 */
	void validate(Instant now, String hostId) {
		requireText(topic, 200, "topic", "INVALID_TOPIC", "Das Thema fehlt oder ist zu lang.");
		requireText(sideA, 80, "sideA", "INVALID_SIDE", "Seite A fehlt oder ist zu lang.");
		requireText(sideB, 80, "sideB", "INVALID_SIDE", "Seite B fehlt oder ist zu lang.");
		if (sideA.equalsIgnoreCase(sideB)) {
			throw DebateException.invalid("INVALID_SIDE", "sideB", "Die beiden Seiten brauchen verschiedene Namen.");
		}
		requireText(category, 40, "category", "INVALID_CATEGORY", "Die Kategorie fehlt oder ist zu lang.");
		if (platform == null) {
			throw DebateException.invalid("INVALID_PLATFORM", "platform", "Die Plattform fehlt.");
		}
		if (!streamUrlMatchesPlatform()) {
			throw DebateException.invalid("INVALID_STREAM_URL", "streamUrl",
					"Die Stream-URL passt nicht zur Plattform.");
		}
		if (startsAt == null || !startsAt.isAfter(now)) {
			throw DebateException.invalid("INVALID_START", "startsAt", "Der Start muss in der Zukunft liegen.");
		}
		if (bettingClosesAt == null || !bettingClosesAt.isAfter(now) || !bettingClosesAt.isBefore(startsAt)) {
			throw DebateException.invalid("INVALID_BETTING_CLOSE", "bettingClosesAt",
					"Der Wettschluss muss in der Zukunft und vor dem Start liegen.");
		}
		validateRuleset();
		validateRoles(hostId);
	}

	/** Das Regelwerk, wie es gespeichert wird: nie gesperrt, fehlende Angaben aus dem Template "standard". */
	Ruleset effectiveRuleset() {
		if (ruleset == null) {
			return Ruleset.standard();
		}
		return new Ruleset(Ruleset.STANDARD, ruleset.jurors(), ruleset.evidence(), ruleset.pointBets(), false);
	}

	private void validateRuleset() {
		Ruleset effective = effectiveRuleset();
		if (ruleset != null && !Ruleset.STANDARD.equals(ruleset.template())) {
			throw DebateException.invalid("INVALID_RULESET", "ruleset", "Dieses Template gibt es nicht.");
		}
		if (!JURY_SIZES.contains(effective.jurors())) {
			throw DebateException.invalid("INVALID_RULESET", "ruleset", "Die Jury hat 3, 5 oder 7 Juroren.");
		}
		if (effective.evidence() == null || effective.pointBets() == null) {
			throw DebateException.invalid("INVALID_RULESET", "ruleset", "Das Regelwerk ist unvollständig.");
		}
	}

	private void validateRoles(String hostId) {
		Set<RoleAssignment> seen = new HashSet<>();
		long jurors = 0;
		for (RoleAssignment assignment : roles) {
			if (assignment == null || assignment.userId() == null || assignment.userId().isBlank()
					|| assignment.role() == null) {
				throw DebateException.invalid("INVALID_ROLE", "roles", "Eine Rolle ist unvollständig.");
			}
			if (assignment.role() == DebateRole.HOST) {
				throw DebateException.invalid("INVALID_ROLE", "roles", "Host wird nicht vergeben, der Anleger ist Host.");
			}
			if (assignment.userId().equals(hostId)) {
				throw DebateException.invalid("HOST_CANNOT_PARTICIPATE", "roles",
						"Der Host ist kein Juror, Moderator oder Resolver derselben Debatte.");
			}
			if (!seen.add(assignment)) {
				throw DebateException.invalid("INVALID_ROLE", "roles", "Dieselbe Person hat dieselbe Rolle doppelt.");
			}
			if (assignment.role() == DebateRole.JUROR) {
				jurors++;
			}
		}
		if (jurors > effectiveRuleset().jurors()) {
			throw DebateException.invalid("TOO_MANY_JURORS", "roles", "Mehr Juroren als die Jury groß ist.");
		}
	}

	private boolean streamUrlMatchesPlatform() {
		if (streamUrl == null || streamUrl.isBlank() || platform == null) {
			return false;
		}
		URI uri;
		try {
			uri = URI.create(streamUrl);
		}
		catch (IllegalArgumentException e) {
			return false;
		}
		if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
			return false;
		}
		String host = uri.getHost().toLowerCase();
		if (host.startsWith("www.")) {
			host = host.substring("www.".length());
		}
		return switch (platform) {
			case YOUTUBE -> Set.of("youtube.com", "m.youtube.com", "youtu.be").contains(host);
			case TWITCH -> host.equals("twitch.tv");
			case X -> Set.of("x.com", "twitter.com").contains(host);
		};
	}

	private static void requireText(String value, int maxLength, String field, String code, String message) {
		if (value == null || value.isEmpty() || value.length() > maxLength) {
			throw DebateException.invalid(code, field, message);
		}
	}

	private static String clean(String value) {
		return value == null ? null : value.strip();
	}

}
