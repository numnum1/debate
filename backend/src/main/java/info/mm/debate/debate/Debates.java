package info.mm.debate.debate;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import info.mm.debate.debate.Debate.RoleAssignment;
import info.mm.debate.identity.Users;

/** Öffentliche Schnittstelle des Moduls für andere Module, z. B. den Chat. */
@Service
public class Debates {

	private static final int MAX_SLUG_LENGTH = 40;
	/** Pfade der Oberfläche unter {@code /home/}, die keine Debatte heißen darf. */
	private static final Set<String> RESERVED_IDS = Set.of("neu");

	private final DebateRepository repository;
	private final Users users;

	Debates(DebateRepository repository, Users users) {
		this.repository = repository;
		this.users = users;
	}

	/** Legt die Debatte an; wer sie anlegt, ist ihr Host. Sie startet in der Phase {@code SCHEDULED}. */
	Debate create(NewDebate request, String hostId, Instant now) {
		request.validate(now, hostId);
		List<String> assignedIds = request.roles().stream().map(RoleAssignment::userId).toList();
		if (!users.existAll(assignedIds)) {
			throw DebateException.invalid("UNKNOWN_USER", "roles", "Eine der genannten Personen ist nicht bekannt.");
		}
		List<RoleAssignment> roles = new ArrayList<>();
		roles.add(new RoleAssignment(hostId, DebateRole.HOST));
		roles.addAll(request.roles());
		return repository.save(new Debate(freeId(request.topic()), request.topic(), request.sideA(), request.sideB(),
				request.category(), request.platform(), request.streamUrl(), DebateStatus.SCHEDULED, request.startsAt(),
				request.bettingClosesAt(), request.effectiveRuleset(), roles));
	}

	/** Aus dem Thema, damit die Adresse lesbar bleibt; bei Kollision mit Zufallssuffix. */
	private String freeId(String topic) {
		String slug = slug(topic);
		String id = slug;
		while (RESERVED_IDS.contains(id) || repository.existsById(id)) {
			id = slug + "-" + UUID.randomUUID().toString().substring(0, 4);
		}
		return id;
	}

	static String slug(String topic) {
		String ascii = Normalizer.normalize(topic.toLowerCase(Locale.GERMAN).replace("ä", "ae").replace("ö", "oe")
			.replace("ü", "ue").replace("ß", "ss"), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
		String slug = ascii.replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
		if (slug.length() > MAX_SLUG_LENGTH) {
			slug = slug.substring(0, MAX_SLUG_LENGTH).replaceAll("-+$", "");
		}
		return slug.isEmpty() ? "debatte" : slug;
	}

	public Optional<Debate> find(String id) {
		return repository.findById(id);
	}

	List<Debate> all() {
		return repository.findAll();
	}

	List<Debate> withRolesFor(String userId) {
		return repository.findByRolesUserId(userId);
	}

}
