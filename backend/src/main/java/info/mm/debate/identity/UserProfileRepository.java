package info.mm.debate.identity;

import org.springframework.data.mongodb.repository.MongoRepository;

interface UserProfileRepository extends MongoRepository<UserProfile, String> {
}
