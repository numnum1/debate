package info.mm.debate.chat;

import static org.springframework.data.mongodb.core.query.Criteria.where;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import info.mm.debate.chat.ChatEvent.MessageHidden;
import info.mm.debate.chat.ChatEvent.MessagePosted;

/** Zugriff auf {@code chat_messages}. */
@Component
class ChatMessages {

	private final MongoTemplate mongo;

	ChatMessages(MongoTemplate mongo) {
		this.mongo = mongo;
	}

	@EventListener(ApplicationReadyEvent.class)
	void createIndexes() {
		var indexes = mongo.indexOps(ChatMessage.class);
		indexes.createIndex(new Index().on("debateId", Sort.Direction.ASC).on("tick", Sort.Direction.ASC));
		indexes.createIndex(new Index().on("debateId", Sort.Direction.ASC).on("hiddenAtTick", Sort.Direction.ASC));
	}

	void insertAll(List<ChatMessage> messages) {
		mongo.insertAll(messages);
	}

	Optional<ChatMessage> find(String debateId, String messageId) {
		return Optional.ofNullable(
				mongo.findOne(Query.query(where("_id").is(messageId).and("debateId").is(debateId)), ChatMessage.class));
	}

	/** @return {@code true}, wenn die Nachricht jetzt ausgeblendet ist und es vorher nicht war */
	boolean hide(String debateId, String messageId, long tick, String hiddenBy) {
		Query query = Query.query(where("_id").is(messageId).and("debateId").is(debateId).and("hiddenAtTick").is(null));
		return mongo.updateFirst(query, new Update().set("hiddenAtTick", tick).set("hiddenBy", hiddenBy),
				ChatMessage.class).getModifiedCount() == 1;
	}

	/** Höchste vergebene Tick-Nummer der Debatte, 0 wenn es noch keine gibt. */
	long lastTick(String debateId) {
		long posted = max(debateId, "tick");
		long hidden = max(debateId, "hiddenAtTick");
		return Math.max(posted, hidden);
	}

	private long max(String debateId, String field) {
		Query query = Query.query(where("debateId").is(debateId).and(field).ne(null))
			.with(Sort.by(Sort.Direction.DESC, field))
			.limit(1);
		ChatMessage message = mongo.findOne(query, ChatMessage.class);
		if (message == null) {
			return 0;
		}
		return "tick".equals(field) ? message.tick() : message.hiddenAtTick();
	}

	/** Die letzten {@code limit} Nachrichten in Chat-Reihenfolge. */
	List<ChatMessage> latest(String debateId, int limit, boolean includeHidden) {
		Criteria criteria = where("debateId").is(debateId);
		if (!includeHidden) {
			criteria = criteria.and("hiddenAtTick").is(null);
		}
		Query query = Query.query(criteria)
			.with(Sort.by(Sort.Order.desc("tick"), Sort.Order.desc("position")))
			.limit(limit);
		List<ChatMessage> messages = new ArrayList<>(mongo.find(query, ChatMessage.class));
		Collections.reverse(messages);
		return messages;
	}

	/** Baut alle Ticks nach {@code afterTick} aus den gespeicherten Nachrichten nach. */
	List<ChatTick> ticksAfter(String debateId, long afterTick) {
		Map<Long, List<ChatEvent>> events = new TreeMap<>();
		Query posted = Query.query(where("debateId").is(debateId).and("tick").gt(afterTick))
			.with(Sort.by(Sort.Order.asc("tick"), Sort.Order.asc("position")));
		for (ChatMessage message : mongo.find(posted, ChatMessage.class)) {
			events.computeIfAbsent(message.tick(), tick -> new ArrayList<>()).add(MessagePosted.of(message));
		}
		Query hidden = Query.query(where("debateId").is(debateId).and("hiddenAtTick").gt(afterTick));
		for (ChatMessage message : mongo.find(hidden, ChatMessage.class)) {
			events.computeIfAbsent(message.hiddenAtTick(), tick -> new ArrayList<>())
				.add(new MessageHidden(message.id()));
		}
		return events.entrySet().stream()
			.map(entry -> new ChatTick(debateId, entry.getKey(), List.copyOf(entry.getValue())))
			.toList();
	}

}
