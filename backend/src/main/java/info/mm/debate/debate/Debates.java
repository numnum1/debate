package info.mm.debate.debate;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

/** Öffentliche Schnittstelle des Moduls für andere Module, z. B. den Chat. */
@Service
public class Debates {

	private final DebateRepository repository;

	Debates(DebateRepository repository) {
		this.repository = repository;
	}

	public Optional<Debate> find(String id) {
		return repository.findById(id);
	}

	List<Debate> all() {
		return repository.findAll();
	}

	List<Debate> withRolesFor(String userId) {
		return repository.findByRolesUserId(userId);
	}

}
