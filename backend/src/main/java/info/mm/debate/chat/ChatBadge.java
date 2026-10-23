package info.mm.debate.chat;

import java.util.Set;

import info.mm.debate.debate.DebateRole;

/** Abzeichen neben dem Namen im Chat; Zuschauer haben keins. */
enum ChatBadge {

	HOST,
	MODERATOR,
	RESOLVER,
	ADMIN,
	/** Antwort einer KI, die jemand mit {@code @name} gerufen hat */
	AI;

	/** @return {@code null} für Zuschauer */
	static ChatBadge of(Set<DebateRole> roles, boolean admin) {
		if (roles.contains(DebateRole.HOST)) {
			return HOST;
		}
		if (roles.contains(DebateRole.MODERATOR)) {
			return MODERATOR;
		}
		if (roles.contains(DebateRole.RESOLVER)) {
			return RESOLVER;
		}
		return admin ? ADMIN : null;
	}

}
