package info.mm.debate.identity;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class UsersController {

	private final Users users;

	UsersController(Users users) {
		this.users = users;
	}

	/** Nutzersuche für den Host, der Rollen vergibt; nur für Angemeldete, ohne E-Mail. */
	@GetMapping("/api/users")
	List<Users.Found> search(@RequestParam String q) {
		return users.search(q);
	}

}
