package info.mm.debate.chat;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import info.mm.debate.chat.ChatMessage.ReplyTo;
import info.mm.debate.chat.ChatMessage.Source;

/** Ein Ereignis innerhalb eines Ticks. Im JSON steht die Art im Feld {@code type}. */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
	@JsonSubTypes.Type(value = ChatEvent.MessagePosted.class, name = "message"),
	@JsonSubTypes.Type(value = ChatEvent.MessageHidden.class, name = "hidden") })
sealed interface ChatEvent {

	record MessagePosted(String id, String userId, String userName, ChatBadge badge, String text, String clientNonce,
			Instant sentAt, ReplyTo replyTo, List<Source> sources) implements ChatEvent {

		static MessagePosted of(ChatMessage message) {
			return new MessagePosted(message.id(), message.userId(), message.userName(), message.badge(),
					message.text(), message.clientNonce(), message.sentAt(), message.replyTo(), message.sources());
		}

	}

	record MessageHidden(String messageId) implements ChatEvent {
	}

}
