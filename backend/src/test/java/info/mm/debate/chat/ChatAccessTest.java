package info.mm.debate.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import info.mm.debate.chat.ChatAccess.WriteBlock;
import info.mm.debate.debate.DebateRole;
import info.mm.debate.debate.DebateStatus;

class ChatAccessTest {

	@Test
	void viewerWritesWhileLive() {
		ChatAccess access = ChatAccess.evaluate(DebateStatus.LIVE, Set.of(), true, false, false);
		assertThat(access).isEqualTo(new ChatAccess(true, true, false, null));
	}

	@Test
	void anonymousReadsButCannotWrite() {
		ChatAccess access = ChatAccess.evaluate(DebateStatus.LIVE, Set.of(), false, false, false);
		assertThat(access).isEqualTo(new ChatAccess(true, false, false, WriteBlock.SIGN_IN));
	}

	@Test
	void jurorNeitherReadsNorWritesEvenAsHost() {
		ChatAccess access = ChatAccess.evaluate(DebateStatus.LIVE, Set.of(DebateRole.JUROR, DebateRole.HOST), true,
				true, false);
		assertThat(access).isEqualTo(new ChatAccess(false, false, false, WriteBlock.JUROR));
	}

	@ParameterizedTest
	@EnumSource(value = DebateStatus.class, names = { "LEAD_IN", "LIVE", "VERDICT" })
	void openFromBettingCloseUntilVerdict(DebateStatus status) {
		assertThat(ChatAccess.evaluate(status, Set.of(), true, false, false).canWrite()).isTrue();
	}

	@ParameterizedTest
	@EnumSource(value = DebateStatus.class, names = { "SCHEDULED", "BETTING" })
	void notOpenWhileBettingIsPossible(DebateStatus status) {
		ChatAccess access = ChatAccess.evaluate(status, Set.of(DebateRole.HOST), true, false, false);
		assertThat(access.canWrite()).isFalse();
		assertThat(access.writeBlock()).isEqualTo(WriteBlock.NOT_OPEN_YET);
	}

	@ParameterizedTest
	@EnumSource(value = DebateStatus.class, names = { "SETTLED", "CANCELLED" })
	void readOnlyAfterTheEnd(DebateStatus status) {
		ChatAccess access = ChatAccess.evaluate(status, Set.of(), true, false, false);
		assertThat(access.canRead()).isTrue();
		assertThat(access.writeBlock()).isEqualTo(WriteBlock.CLOSED);
	}

	@Test
	void mutedUserReadsButCannotWrite() {
		ChatAccess access = ChatAccess.evaluate(DebateStatus.LIVE, Set.of(), true, false, true);
		assertThat(access).isEqualTo(new ChatAccess(true, false, false, WriteBlock.MUTED));
	}

	@Test
	void hostModeratorAndAdminModerate() {
		assertThat(ChatAccess.evaluate(DebateStatus.LIVE, Set.of(DebateRole.HOST), true, false, false).canModerate())
			.isTrue();
		assertThat(ChatAccess.evaluate(DebateStatus.LIVE, Set.of(DebateRole.MODERATOR), true, false, false)
			.canModerate()).isTrue();
		assertThat(ChatAccess.evaluate(DebateStatus.LIVE, Set.of(), true, true, false).canModerate()).isTrue();
		assertThat(ChatAccess.evaluate(DebateStatus.LIVE, Set.of(DebateRole.RESOLVER), true, false, false)
			.canModerate()).isFalse();
	}

}
