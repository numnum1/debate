package info.mm.debate.chat;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Stummschaltung eines Nutzers in einer Debatte. Eine neue ersetzt die alte. */
@Document("chat_mutes")
record ChatMute(@Id String id, String debateId, String userId, Instant until, String mutedBy) {

	static String idOf(String debateId, String userId) {
		return debateId + ":" + userId;
	}

}
