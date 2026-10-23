package info.mm.debate.chat;

import org.springframework.data.mongodb.repository.MongoRepository;

interface ChatMuteRepository extends MongoRepository<ChatMute, String> {
}
