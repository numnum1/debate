package info.mm.debate.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

class UsersTest {

	private static final Instant NOW = Instant.parse("2026-10-23T12:00:00Z");

	private final UserProfileRepository repository = mock(UserProfileRepository.class);
	private final Users users = new Users(repository);

	private static UserProfile profile(String id, String username, String displayName) {
		return new UserProfile(id, username, displayName, username + "@debate.local", NOW, NOW);
	}

	@Test
	void shortQueriesFindNothingAndAskNoOne() {
		assertThat(users.search("a")).isEmpty();
		assertThat(users.search("  ")).isEmpty();
		assertThat(users.search(null)).isEmpty();
		verifyNoInteractions(repository);
	}

	@Test
	void searchReturnsIdAndNamesButNoEmail() {
		when(repository.findTop10ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase("da", "da"))
			.thenReturn(List.of(profile("u5", "dave", "Dave Dietrich")));

		assertThat(users.search(" da ")).containsExactly(new Users.Found("u5", "dave", "Dave Dietrich"));
	}

	@Test
	void existAllNeedsEveryDistinctId() {
		when(repository.findAllById(any())).thenReturn(List.of(profile("u1", "a", "A"), profile("u2", "b", "B")));

		assertThat(users.existAll(List.of("u1", "u2", "u2"))).isTrue();
		assertThat(users.existAll(List.of("u1", "u2", "u3"))).isFalse();
	}

}
