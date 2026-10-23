package info.mm.debate.debate;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import info.mm.debate.debate.Debate.RoleAssignment;

class DebateTest {

	private static final Instant CLOSES = Instant.parse("2026-10-23T19:30:00Z");

	private static Debate debate(DebateStatus status, RoleAssignment... roles) {
		return new Debate("d", "Thema", "A", "B", "Politik", Platform.YOUTUBE, status,
				CLOSES.plus(Duration.ofMinutes(30)), CLOSES, List.of(roles));
	}

	@Test
	void bettingBecomesLeadInAtBettingClose() {
		Debate debate = debate(DebateStatus.BETTING);
		assertThat(debate.statusAt(CLOSES.minusMillis(1))).isEqualTo(DebateStatus.BETTING);
		assertThat(debate.statusAt(CLOSES)).isEqualTo(DebateStatus.LEAD_IN);
	}

	@Test
	void otherPhasesIgnoreBettingClose() {
		assertThat(debate(DebateStatus.SCHEDULED).statusAt(CLOSES.plusSeconds(60))).isEqualTo(DebateStatus.SCHEDULED);
		assertThat(debate(DebateStatus.LIVE).statusAt(CLOSES.minusSeconds(60))).isEqualTo(DebateStatus.LIVE);
	}

	@Test
	void rolesOfCollectsAllRolesOfOneUser() {
		Debate debate = debate(DebateStatus.LIVE, new RoleAssignment("u1", DebateRole.HOST),
				new RoleAssignment("u2", DebateRole.JUROR), new RoleAssignment("u1", DebateRole.MODERATOR));
		assertThat(debate.rolesOf("u1")).containsExactlyInAnyOrder(DebateRole.HOST, DebateRole.MODERATOR);
		assertThat(debate.rolesOf("u3")).isEmpty();
	}

}
