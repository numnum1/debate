package info.mm.debate.debate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import info.mm.debate.debate.Debate.RoleAssignment;

class NewDebateTest {

	private static final Instant NOW = Instant.parse("2026-10-23T12:00:00Z");
	private static final Instant STARTS = NOW.plus(Duration.ofHours(5));
	private static final Instant CLOSES = STARTS.minus(Duration.ofMinutes(30));
	private static final String HOST = "host";

	private static NewDebate valid() {
		return new NewDebate("Tempolimit 130?", "Anna", "Ben", "Verkehr", Platform.YOUTUBE,
				"https://www.youtube.com/watch?v=abc", STARTS, CLOSES, null, List.of());
	}

	private static NewDebate with(Platform platform, String streamUrl) {
		return new NewDebate("Thema", "A", "B", "Politik", platform, streamUrl, STARTS, CLOSES, null, List.of());
	}

	private static NewDebate withRoles(Ruleset ruleset, RoleAssignment... roles) {
		return new NewDebate("Thema", "A", "B", "Politik", Platform.TWITCH, "https://twitch.tv/x", STARTS, CLOSES,
				ruleset, List.of(roles));
	}

	private static void assertRejected(NewDebate request, String code, String field) {
		assertThatThrownBy(() -> request.validate(NOW, HOST))
			.isInstanceOfSatisfying(DebateException.class, e -> {
				assertThat(e.code()).isEqualTo(code);
				assertThat(e.field()).isEqualTo(field);
			});
	}

	@Test
	void acceptsCompleteRequest() {
		assertThatCode(() -> valid().validate(NOW, HOST)).doesNotThrowAnyException();
	}

	@Test
	void trimsTexts() {
		NewDebate request = new NewDebate("  Thema ", " A", "B ", " Politik ", Platform.X, "https://x.com/i/broadcasts/1",
				STARTS, CLOSES, null, null);
		assertThat(request.topic()).isEqualTo("Thema");
		assertThat(request.category()).isEqualTo("Politik");
		assertThat(request.roles()).isEmpty();
	}

	@Test
	void rejectsMissingTopicAndSides() {
		assertRejected(new NewDebate(" ", "A", "B", "Politik", Platform.X, "https://x.com/1", STARTS, CLOSES, null, null),
				"INVALID_TOPIC", "topic");
		assertRejected(new NewDebate("T", "", "B", "Politik", Platform.X, "https://x.com/1", STARTS, CLOSES, null, null),
				"INVALID_SIDE", "sideA");
		assertRejected(new NewDebate("T", "A", "a", "Politik", Platform.X, "https://x.com/1", STARTS, CLOSES, null, null),
				"INVALID_SIDE", "sideB");
	}

	@Test
	void streamUrlMustMatchPlatform() {
		assertThatCode(() -> with(Platform.YOUTUBE, "https://youtu.be/abc").validate(NOW, HOST)).doesNotThrowAnyException();
		assertThatCode(() -> with(Platform.TWITCH, "https://www.twitch.tv/kanal").validate(NOW, HOST))
			.doesNotThrowAnyException();
		assertThatCode(() -> with(Platform.X, "https://twitter.com/i/broadcasts/1").validate(NOW, HOST))
			.doesNotThrowAnyException();
		assertRejected(with(Platform.TWITCH, "https://www.youtube.com/watch?v=abc"), "INVALID_STREAM_URL", "streamUrl");
		assertRejected(with(Platform.YOUTUBE, "http://youtu.be/abc"), "INVALID_STREAM_URL", "streamUrl");
		assertRejected(with(Platform.YOUTUBE, "kein link"), "INVALID_STREAM_URL", "streamUrl");
		assertRejected(with(Platform.YOUTUBE, "https://youtube.com.evil.example/x"), "INVALID_STREAM_URL", "streamUrl");
		assertRejected(with(Platform.YOUTUBE, null), "INVALID_STREAM_URL", "streamUrl");
	}

	@Test
	void startAndBettingCloseMustBeInTheFutureAndOrdered() {
		assertRejected(new NewDebate("T", "A", "B", "P", Platform.X, "https://x.com/1", NOW, NOW.minusSeconds(1), null, null),
				"INVALID_START", "startsAt");
		assertRejected(new NewDebate("T", "A", "B", "P", Platform.X, "https://x.com/1", STARTS, STARTS, null, null),
				"INVALID_BETTING_CLOSE", "bettingClosesAt");
		assertRejected(new NewDebate("T", "A", "B", "P", Platform.X, "https://x.com/1", STARTS, NOW, null, null),
				"INVALID_BETTING_CLOSE", "bettingClosesAt");
	}

	@Test
	void missingRulesetFallsBackToStandard() {
		assertThat(valid().effectiveRuleset()).isEqualTo(Ruleset.standard());
	}

	@Test
	void rulesetIsNeverStoredAsLocked() {
		Ruleset sent = new Ruleset("standard", 5, Ruleset.Evidence.OPEN, Ruleset.PointBets.PRESET, true);
		assertThat(withRoles(sent).effectiveRuleset())
			.isEqualTo(new Ruleset("standard", 5, Ruleset.Evidence.OPEN, Ruleset.PointBets.PRESET, false));
	}

	@Test
	void rejectsInvalidRuleset() {
		assertRejected(withRoles(new Ruleset("standard", 4, Ruleset.Evidence.CLOSED, Ruleset.PointBets.OFF, false)),
				"INVALID_RULESET", "ruleset");
		assertRejected(withRoles(new Ruleset("streng", 3, Ruleset.Evidence.CLOSED, Ruleset.PointBets.OFF, false)),
				"INVALID_RULESET", "ruleset");
		assertRejected(withRoles(new Ruleset("standard", 3, null, Ruleset.PointBets.OFF, false)), "INVALID_RULESET",
				"ruleset");
	}

	@Test
	void hostIsNotAJurorModeratorOrResolver() {
		assertRejected(withRoles(null, new RoleAssignment(HOST, DebateRole.JUROR)), "HOST_CANNOT_PARTICIPATE", "roles");
		assertRejected(withRoles(null, new RoleAssignment(HOST, DebateRole.MODERATOR)), "HOST_CANNOT_PARTICIPATE",
				"roles");
	}

	@Test
	void hostRoleIsNotAssignable() {
		assertRejected(withRoles(null, new RoleAssignment("u1", DebateRole.HOST)), "INVALID_ROLE", "roles");
	}

	@Test
	void rejectsSameRoleTwiceButAllowsDifferentRolesForOnePerson() {
		assertRejected(withRoles(null, new RoleAssignment("u1", DebateRole.JUROR), new RoleAssignment("u1", DebateRole.JUROR)),
				"INVALID_ROLE", "roles");
		assertThatCode(() -> withRoles(null, new RoleAssignment("u1", DebateRole.MODERATOR),
				new RoleAssignment("u1", DebateRole.RESOLVER)).validate(NOW, HOST)).doesNotThrowAnyException();
	}

	@Test
	void notMoreJurorsThanTheJurySize() {
		RoleAssignment[] four = {
			new RoleAssignment("u1", DebateRole.JUROR), new RoleAssignment("u2", DebateRole.JUROR),
			new RoleAssignment("u3", DebateRole.JUROR), new RoleAssignment("u4", DebateRole.JUROR)
		};
		assertRejected(withRoles(null, four), "TOO_MANY_JURORS", "roles");
		Ruleset five = new Ruleset("standard", 5, Ruleset.Evidence.CLOSED, Ruleset.PointBets.OFF, false);
		assertThatCode(() -> withRoles(five, four).validate(NOW, HOST)).doesNotThrowAnyException();
	}

	@Test
	void fewerJurorsThanTheJurySizeAreAllowedForNow() {
		assertThatCode(() -> withRoles(null, new RoleAssignment("u1", DebateRole.JUROR)).validate(NOW, HOST))
			.doesNotThrowAnyException();
	}

}
