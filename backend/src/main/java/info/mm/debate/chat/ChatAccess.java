package info.mm.debate.chat;

import java.util.EnumSet;
import java.util.Set;

import info.mm.debate.debate.DebateRole;
import info.mm.debate.debate.DebateStatus;

/**
 * Was ein Nutzer im Chat einer Debatte darf. Reine Regel ohne Infrastruktur (Leitprinzip 7).
 *
 * @param writeBlock warum Schreiben nicht geht; {@code null}, wenn es geht
 */
record ChatAccess(boolean canRead, boolean canWrite, boolean canModerate, WriteBlock writeBlock) {

	/** Phasen, in denen geschrieben werden darf: vom Wettschluss bis zum Ende der Jury-Beratung. */
	static final Set<DebateStatus> OPEN = EnumSet.of(DebateStatus.LEAD_IN, DebateStatus.LIVE, DebateStatus.VERDICT);

	enum WriteBlock {
		SIGN_IN,
		JUROR,
		NOT_OPEN_YET,
		CLOSED,
		MUTED
	}

	/**
	 * @param roles Rollen des Nutzers in dieser Debatte; leer für Zuschauer und Nicht-Angemeldete
	 * @param admin globale Keycloak-Rolle {@code admin}
	 */
	static ChatAccess evaluate(DebateStatus status, Set<DebateRole> roles, boolean signedIn, boolean admin,
			boolean muted) {
		// Hat jemand mehrere Rollen, gilt die strengste: Juroren sehen den Chat gar nicht
		if (roles.contains(DebateRole.JUROR)) {
			return new ChatAccess(false, false, false, WriteBlock.JUROR);
		}
		boolean canModerate = signedIn
				&& (admin || roles.contains(DebateRole.HOST) || roles.contains(DebateRole.MODERATOR));
		WriteBlock block;
		if (!signedIn) {
			block = WriteBlock.SIGN_IN;
		}
		else if (status == DebateStatus.SCHEDULED || status == DebateStatus.BETTING) {
			block = WriteBlock.NOT_OPEN_YET;
		}
		else if (!OPEN.contains(status)) {
			block = WriteBlock.CLOSED;
		}
		else if (muted) {
			block = WriteBlock.MUTED;
		}
		else {
			block = null;
		}
		return new ChatAccess(true, block == null, canModerate, block);
	}

}
