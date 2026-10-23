package info.mm.debate.chat;

import java.time.Instant;
import java.util.List;

import info.mm.debate.chat.ChatAccess.WriteBlock;

/**
 * Stand beim Öffnen des Chats: die letzten Nachrichten und die Nummer des letzten Ticks, ab der der Client live
 * weitermacht.
 */
record ChatSnapshot(String debateId, long tick, List<MessageView> messages, Permissions permissions) {

	/** @param hidden nur Moderatoren bekommen ausgeblendete Nachrichten überhaupt zu sehen */
	record MessageView(String id, long tick, String userId, String userName, ChatBadge badge, String text,
			String clientNonce, Instant sentAt, boolean hidden) {

		static MessageView of(ChatMessage message) {
			return new MessageView(message.id(), message.tick(), message.userId(), message.userName(),
					message.badge(), message.text(), message.clientNonce(), message.sentAt(), message.hidden());
		}

	}

	/** @param opensAt Wettschluss, ab dem geschrieben werden darf */
	record Permissions(boolean canWrite, boolean canModerate, WriteBlock writeBlock, Instant opensAt,
			Instant mutedUntil, int maxLength) {
	}

}
