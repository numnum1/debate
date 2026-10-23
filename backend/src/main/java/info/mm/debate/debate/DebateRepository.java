package info.mm.debate.debate;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

interface DebateRepository extends MongoRepository<Debate, String> {

	List<Debate> findByRolesUserId(String userId);

}
