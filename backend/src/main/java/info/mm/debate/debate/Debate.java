package info.mm.debate.debate;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Eine Debatte, die auf Twitch, YouTube oder X stattfindet. Die Debattierer sind nur Namen ({@code sideA},
 * {@code sideB}), keine Nutzer. Die Rollen stehen im Dokument, weil es pro Debatte nur wenige sind.
 *
 * @param status gespeicherte Phase; die aktuelle liefert {@link #statusAt(Instant)}
 * @param bettingClosesAt Wettschluss, fest vom Host gewählt; ab hier ist der Markt zu und der Chat offen
 */
@Document("debates")
public record Debate(
		@Id String id,
		String topic,
		String sideA,
		String sideB,
		String category,
		Platform platform,
		DebateStatus status,
		Instant startsAt,
		Instant bettingClosesAt,
		List<RoleAssignment> roles) {

	public Debate {
		roles = roles == null ? List.of() : List.copyOf(roles);
	}

	/** Phase zum Zeitpunkt {@code now}: Offene Wetten werden mit dem Wettschluss zum Vorlauf. */
	public DebateStatus statusAt(Instant now) {
		if (status == DebateStatus.BETTING && !now.isBefore(bettingClosesAt)) {
			return DebateStatus.LEAD_IN;
		}
		return status;
	}

	/** Alle Rollen des Nutzers in dieser Debatte; leer heißt Zuschauer. */
	public Set<DebateRole> rolesOf(String userId) {
		Set<DebateRole> result = EnumSet.noneOf(DebateRole.class);
		for (RoleAssignment assignment : roles) {
			if (assignment.userId().equals(userId)) {
				result.add(assignment.role());
			}
		}
		return result;
	}

	/** @param userId Keycloak-{@code sub} */
	public record RoleAssignment(String userId, DebateRole role) {
	}

}
