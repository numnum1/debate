package info.mm.debate.chat;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Eine Chat-Nachricht, dauerhaft gespeichert. {@code tick} und {@code position} legen die Reihenfolge fest.
 * Ausblenden löscht nicht, sondern merkt sich den Tick, in dem es passiert ist; so lässt sich jeder Tick nachholen.
 *
 * @param badge Rolle beim Senden, {@code null} für Zuschauer
 * @param clientNonce vom Client erzeugt, damit er seine eigene Nachricht im Tick wiedererkennt
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
		String hiddenBy) {

	ChatMessage inTick(long tick, int position) {
		return new ChatMessage(id, debateId, tick, position, userId, userName, badge, text, clientNonce, sentAt, null,
				null);
	}

	boolean hidden() {
		return hiddenAtTick != null;
	}

}
