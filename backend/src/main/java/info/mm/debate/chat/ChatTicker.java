package info.mm.debate.chat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import info.mm.debate.chat.ChatEvent.MessageHidden;
import info.mm.debate.chat.ChatEvent.MessagePosted;

/**
 * Sammelt Chat-Aktionen pro Debatte und verschickt sie alle 250 ms als einen Tick. Leere Ticks verbrauchen keine
 * Nummer, deshalb erkennen Clients an einer übersprungenen Nummer, dass sie etwas nachholen müssen.
 */
@Component
class ChatTicker {

	static final long TICK_MILLIS = 250;

	private static final Logger log = LoggerFactory.getLogger(ChatTicker.class);

	private final ChatMessages messages;
	private final SimpMessageSendingOperations messaging;
	private final Map<String, Room> rooms = new ConcurrentHashMap<>();

	// Lazy, weil der Messaging-Template erst mit der WebSocket-Konfiguration entsteht, die wiederum den Chat braucht
	ChatTicker(ChatMessages messages, @Lazy SimpMessageSendingOperations messaging) {
		this.messages = messages;
		this.messaging = messaging;
	}

	static String topic(String debateId) {
		return "/topic/debates/" + debateId + "/chat";
	}

	void post(ChatMessage message) {
		room(message.debateId()).pending.add(message);
	}

	void hide(String debateId, String messageId, String hiddenBy) {
		room(debateId).pending.add(new Hide(messageId, hiddenBy));
	}

	/** Nummer des letzten verschickten Ticks. */
	long currentTick(String debateId) {
		Room room = room(debateId);
		synchronized (room) {
			return room.lastTick();
		}
	}

	@Scheduled(fixedRate = TICK_MILLIS)
	void tick() {
		rooms.values().forEach(this::flush);
	}

	private void flush(Room room) {
		if (room.pending.isEmpty()) {
			return;
		}
		synchronized (room) {
			long tick = room.lastTick() + 1;
			List<ChatMessage> posted = new ArrayList<>();
			List<Hide> hides = new ArrayList<>();
			Object action;
			while ((action = room.pending.poll()) != null) {
				if (action instanceof ChatMessage message) {
					posted.add(message.inTick(tick, posted.size()));
				}
				else if (action instanceof Hide hide) {
					hides.add(hide);
				}
			}

			List<ChatEvent> events = new ArrayList<>();
			try {
				if (!posted.isEmpty()) {
					messages.insertAll(posted);
					posted.forEach(message -> events.add(MessagePosted.of(message)));
				}
				for (Hide hide : hides) {
					if (messages.hide(room.debateId, hide.messageId(), tick, hide.hiddenBy())) {
						events.add(new MessageHidden(hide.messageId()));
					}
				}
			}
			catch (RuntimeException e) {
				// Die Nummer gilt trotzdem als vergeben: Clients sehen die Lücke und holen nach, was gespeichert ist
				log.error("Chat-Tick {} für Debatte {} nicht vollständig gespeichert", tick, room.debateId, e);
				room.lastTick = tick;
				return;
			}
			// Nur bereits ausgeblendete Nachrichten erneut ausgeblendet: kein Ereignis, keine Nummer
			if (events.isEmpty()) {
				return;
			}
			room.lastTick = tick;
			messaging.convertAndSend(topic(room.debateId), new ChatTick(room.debateId, tick, events));
		}
	}

	private Room room(String debateId) {
		return rooms.computeIfAbsent(debateId, Room::new);
	}

	private record Hide(String messageId, String hiddenBy) {
	}

	private final class Room {

		final String debateId;
		final Queue<Object> pending = new ConcurrentLinkedQueue<>();
		/** -1 = noch nicht aus der Datenbank gelesen; nur unter {@code synchronized (this)} benutzen */
		long lastTick = -1;

		Room(String debateId) {
			this.debateId = debateId;
		}

		long lastTick() {
			if (lastTick < 0) {
				lastTick = messages.lastTick(debateId);
			}
			return lastTick;
		}

	}

}
