package info.mm.debate.chat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import info.mm.debate.ai.AiModel;
import info.mm.debate.chat.ChatAccess.WriteBlock;
import info.mm.debate.debate.Debate;
import info.mm.debate.debate.DebateRole;
import info.mm.debate.debate.Debates;

@Service
class ChatService {

	static final int HISTORY = 200;
	static final int MAX_LENGTH = 300;
	static final Duration MIN_INTERVAL = Duration.ofSeconds(2);
	static final int MAX_MUTE_MINUTES = 24 * 60;

	private final Debates debates;
	private final ChatMessages messages;
	private final ChatMuteRepository mutes;
	private final ChatTicker ticker;
	private final ChatAssistant assistant;
	private final Clock clock = Clock.systemUTC();
	/** Letzte Nachricht je Debatte und Nutzer, für das Rate-Limit */
	private final Map<String, Instant> lastPost = new ConcurrentHashMap<>();

	ChatService(Debates debates, ChatMessages messages, ChatMuteRepository mutes, ChatTicker ticker,
			ChatAssistant assistant) {
		this.debates = debates;
		this.messages = messages;
		this.mutes = mutes;
		this.ticker = ticker;
		this.assistant = assistant;
	}

	/** @param user {@code null}, wenn niemand angemeldet ist */
	ChatAccess access(String debateId, ChatUser user) {
		return access(debate(debateId), user, clock.instant());
	}

	ChatSnapshot snapshot(String debateId, ChatUser user) {
		Instant now = clock.instant();
		Debate debate = debate(debateId);
		ChatAccess access = requireRead(debate, user, now);
		// Erst die Nummer, dann die Nachrichten: Was bis zu diesem Tick passiert ist, ist dann sicher dabei
		long tick = ticker.currentTick(debateId);
		List<ChatMessage> latest = messages.latest(debateId, HISTORY, access.canModerate());
		return new ChatSnapshot(debateId, tick, latest.stream().map(ChatSnapshot.MessageView::of).toList(),
				new ChatSnapshot.Permissions(access.canWrite(), access.canModerate(), access.writeBlock(),
						debate.bettingClosesAt(), user == null ? null : mutedUntil(debateId, user.id(), now).orElse(null),
						MAX_LENGTH),
				assistant.models().stream()
					.map(model -> new ChatSnapshot.Assistant(model.name(), model.displayName()))
					.toList());
	}

	List<ChatTick> ticksAfter(String debateId, ChatUser user, long afterTick) {
		requireRead(debate(debateId), user, clock.instant());
		return messages.ticksAfter(debateId, afterTick);
	}

	/** Nimmt die Nachricht an; verschickt wird sie mit dem nächsten Tick. */
	ChatMessage post(String debateId, ChatUser user, String text, String clientNonce) {
		Instant now = clock.instant();
		Debate debate = debate(debateId);
		ChatAccess access = access(debate, user, now);
		if (!access.canWrite()) {
			throw blocked(access.writeBlock(), debateId, user, now);
		}
		String trimmed = text == null ? "" : text.strip();
		if (trimmed.isEmpty() || trimmed.length() > MAX_LENGTH) {
			throw new ChatException(HttpStatus.BAD_REQUEST, "INVALID_TEXT",
					"Eine Nachricht hat 1 bis " + MAX_LENGTH + " Zeichen.");
		}
		if (!access.canModerate()) {
			String key = debateId + ":" + user.id();
			Instant previous = lastPost.get(key);
			if (previous != null && previous.plus(MIN_INTERVAL).isAfter(now)) {
				throw new ChatException(HttpStatus.TOO_MANY_REQUESTS, "TOO_FAST", "Bitte kurz warten.");
			}
			lastPost.put(key, now);
		}
		Optional<AiModel> mentioned = assistant.mentioned(trimmed);
		if (mentioned.isPresent()) {
			assistant.claim(debateId, user.id());
		}
		Set<DebateRole> roles = debate.rolesOf(user.id());
		ChatMessage message = ChatMessage.fromUser(new ObjectId().toHexString(), debateId, user,
				ChatBadge.of(roles, user.admin()), trimmed, clientNonce, now);
		ticker.post(message);
		mentioned.ifPresent(model -> assistant.answerLater(debate, message, model));
		return message;
	}

	void hide(String debateId, ChatUser user, String messageId) {
		requireModerator(debate(debateId), user);
		if (messages.find(debateId, messageId).isEmpty()) {
			throw new ChatException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Diese Nachricht gibt es nicht.");
		}
		ticker.hide(debateId, messageId, user.id());
	}

	Instant mute(String debateId, ChatUser user, String targetUserId, int minutes) {
		Debate debate = debate(debateId);
		requireModerator(debate, user);
		if (minutes < 1 || minutes > MAX_MUTE_MINUTES) {
			throw new ChatException(HttpStatus.BAD_REQUEST, "INVALID_DURATION",
					"Stummschalten geht für 1 bis " + MAX_MUTE_MINUTES + " Minuten.");
		}
		Set<DebateRole> targetRoles = debate.rolesOf(targetUserId);
		if (targetUserId.equals(user.id()) || targetRoles.contains(DebateRole.HOST)
				|| targetRoles.contains(DebateRole.MODERATOR)) {
			throw new ChatException(HttpStatus.CONFLICT, "CANNOT_MUTE",
					"Host und Moderatoren lassen sich nicht stummschalten.");
		}
		Instant until = clock.instant().plus(Duration.ofMinutes(minutes));
		mutes.save(new ChatMute(ChatMute.idOf(debateId, targetUserId), debateId, targetUserId, until, user.id()));
		return until;
	}

	private ChatAccess access(Debate debate, ChatUser user, Instant now) {
		if (user == null) {
			return ChatAccess.evaluate(debate.statusAt(now), Set.of(), false, false, false);
		}
		boolean muted = mutedUntil(debate.id(), user.id(), now).isPresent();
		return ChatAccess.evaluate(debate.statusAt(now), debate.rolesOf(user.id()), true, user.admin(), muted);
	}

	private ChatAccess requireRead(Debate debate, ChatUser user, Instant now) {
		ChatAccess access = access(debate, user, now);
		if (!access.canRead()) {
			throw new ChatException(HttpStatus.FORBIDDEN, "JUROR", "Juroren sehen den Chat nicht.");
		}
		return access;
	}

	private void requireModerator(Debate debate, ChatUser user) {
		if (user == null || !access(debate, user, clock.instant()).canModerate()) {
			throw new ChatException(HttpStatus.FORBIDDEN, "NOT_MODERATOR", "Nur Host und Moderatoren dürfen das.");
		}
	}

	private Optional<Instant> mutedUntil(String debateId, String userId, Instant now) {
		return mutes.findById(ChatMute.idOf(debateId, userId)).map(ChatMute::until).filter(now::isBefore);
	}

	private ChatException blocked(WriteBlock block, String debateId, ChatUser user, Instant now) {
		return switch (block) {
			case SIGN_IN -> new ChatException(HttpStatus.UNAUTHORIZED, "SIGN_IN", "Zum Chatten anmelden.");
			case JUROR -> new ChatException(HttpStatus.FORBIDDEN, "JUROR", "Juroren sehen den Chat nicht.");
			case NOT_OPEN_YET -> new ChatException(HttpStatus.CONFLICT, "NOT_OPEN_YET",
					"Der Chat öffnet mit dem Wettschluss.");
			case CLOSED -> new ChatException(HttpStatus.CONFLICT, "CLOSED", "Der Chat ist geschlossen.");
			case MUTED -> new ChatException(HttpStatus.FORBIDDEN, "MUTED", "Du bist stummgeschaltet.",
					mutedUntil(debateId, user.id(), now).orElse(null));
		};
	}

	private Debate debate(String debateId) {
		return debates.find(debateId)
			.orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Diese Debatte gibt es nicht."));
	}

}
