package info.mm.debate.chat;

import java.time.Instant;

import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

/**
 * Hinweise, die nur ein Nutzer sieht, außerhalb der Ticks. Sie gehen an {@code /user/queue/chat} und werden nicht
 * gespeichert: Wer gerade nicht verbunden ist, bekommt sie nicht.
 */
@Component
class ChatNotices {

	static final String QUEUE = "/queue/chat";

	private final SimpMessageSendingOperations messaging;

	// Lazy aus demselben Grund wie im ChatTicker
	ChatNotices(@Lazy SimpMessageSendingOperations messaging) {
		this.messaging = messaging;
	}

	/** @param userId Keycloak-{@code sub}, so heißt der Nutzer auch in der WebSocket-Sitzung */
	void send(String userId, Notice notice) {
		messaging.convertAndSendToUser(userId, QUEUE, notice);
	}

	/** @param messageId die Nachricht, um die es geht, z. B. die entfernte Frage an die KI */
	record Notice(String debateId, String text, String messageId, Instant sentAt) {
	}

}
