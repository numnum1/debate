package info.mm.debate.debate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import info.mm.debate.debate.Debate.RoleAssignment;
import info.mm.debate.identity.Users;

class DebatesTest {

	private static final Instant NOW = Instant.parse("2026-10-23T12:00:00Z");
	private static final Instant STARTS = NOW.plus(Duration.ofHours(5));

	private final DebateRepository repository = mock(DebateRepository.class);
	private final Users users = mock(Users.class);
	private final Debates debates = new Debates(repository, users);

	@BeforeEach
	void setUp() {
		when(repository.save(any(Debate.class))).thenAnswer(call -> call.getArgument(0));
		when(users.existAll(any())).thenReturn(true);
	}

	private static NewDebate request(String topic, RoleAssignment... roles) {
		return new NewDebate(topic, "Anna", "Ben", "Verkehr", Platform.YOUTUBE, "https://youtu.be/abc", STARTS,
				STARTS.minus(Duration.ofMinutes(30)), null, List.of(roles));
	}

	@Test
	void creatorBecomesHostAndDebateIsScheduled() {
		Debate debate = debates.create(request("Tempolimit 130?", new RoleAssignment("u1", DebateRole.JUROR)), "host", NOW);

		assertThat(debate.id()).isEqualTo("tempolimit-130");
		assertThat(debate.status()).isEqualTo(DebateStatus.SCHEDULED);
		assertThat(debate.rolesOf("host")).containsExactly(DebateRole.HOST);
		assertThat(debate.rolesOf("u1")).containsExactly(DebateRole.JUROR);
		assertThat(debate.ruleset().locked()).isFalse();
	}

	@Test
	void unknownUserIsRejectedAndNothingIsSaved() {
		when(users.existAll(any())).thenReturn(false);

		assertThatThrownBy(() -> debates.create(request("Thema", new RoleAssignment("ghost", DebateRole.JUROR)), "host", NOW))
			.isInstanceOfSatisfying(DebateException.class, e -> assertThat(e.code()).isEqualTo("UNKNOWN_USER"));
		verify(repository, never()).save(any());
	}

	@Test
	void takenIdGetsASuffix() {
		when(repository.existsById("thema")).thenReturn(true);
		when(repository.existsById(startsWith("thema-"))).thenReturn(false);

		Debate debate = debates.create(request("Thema"), "host", NOW);

		assertThat(debate.id()).startsWith("thema-").hasSize("thema-".length() + 4);
	}

	@Test
	void reservedPathIsNeverAnId() {
		Debate debate = debates.create(request("Neu"), "host", NOW);

		assertThat(debate.id()).startsWith("neu-").hasSize("neu-".length() + 4);
	}

	@Test
	void slugIsReadableAndSafe() {
		assertThat(Debates.slug("Müssen wir die Wehrpflicht zurückholen?")).isEqualTo("muessen-wir-die-wehrpflicht-zurueckholen");
		assertThat(Debates.slug("Straße & Co.")).isEqualTo("strasse-co");
		assertThat(Debates.slug("???")).isEqualTo("debatte");
		assertThat(Debates.slug("a".repeat(100))).hasSize(40);
		assertThat(Debates.slug("Ein sehr langes Thema über etwas ganz anderes als gedacht")).doesNotEndWith("-");
	}

}
