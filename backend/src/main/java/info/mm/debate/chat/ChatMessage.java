package info.mm.debate.chat;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Eine Chat-Nachricht, dauerhaft gespeichert. {@code tick} und {@code position} legen die Reihenfolge fest.
 * Ausblenden löscht nicht, sondern merkt sich den Tick, in dem es passiert ist; so lässt sich jeder Tick nachholen.
 *
 * @param badge Rolle beim Senden, {@code null} für Zuschauer
 * @param clientNonce vom Client erzeugt, damit er seine eigene Nachricht im Tick wiedererkennt
 * @param replyTo nur bei KI-Antworten: die Frage, auf die sie antwortet
 * @param sources nur bei KI-Antworten, sonst leer
 * @param ai nur bei KI-Antworten: wie sie entstanden ist, nicht für Clients
 */
@Document("chat_messages")
record ChatMessage(
		@Id String id,
		String debateId,
		long tick,
		int position,
		String userId,
		String userName,
		ChatBadge badge,
		String text,
		String clientNonce,
		Instant sentAt,
		Long hiddenAtTick,
		String hiddenBy,
		ReplyTo replyTo,
		List<Source> sources,
		AiOrigin ai) {

	ChatMessage {
		sources = sources == null ? List.of() : List.copyOf(sources);
	}

	/** Eine Nachricht von einem Nutzer. */
	static ChatMessage fromUser(String id, String debateId, ChatUser user, ChatBadge badge, String text,
			String clientNonce, Instant sentAt) {
		return new ChatMessage(id, debateId, 0, 0, user.id(), user.name(), badge, text, clientNonce, sentAt, null, null,
				null, List.of(), null);
	}

	ChatMessage inTick(long tick, int position) {
		return new ChatMessage(id, debateId, tick, position, userId, userName, badge, text, clientNonce, sentAt, null,
				null, replyTo, sources, ai);
	}

	boolean hidden() {
		return hiddenAtTick != null;
	}

	/** @param excerpt Anfang der Frage, damit Clients sie auch zeigen können, wenn sie nicht mehr in der Liste ist */
	record ReplyTo(String messageId, String userName, String excerpt) {
	}

	record Source(String title, String url) {
	}

	/** @param model Anbieter und Modell, z. B. {@code xAI/grok-4} */
	record AiOrigin(String model, String promptVersion) {
	}

}
