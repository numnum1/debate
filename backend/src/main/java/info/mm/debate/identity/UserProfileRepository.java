package info.mm.debate.identity;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

interface UserProfileRepository extends MongoRepository<UserProfile, String> {

	List<UserProfile> findTop10ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(String username,
			String displayName);

}
