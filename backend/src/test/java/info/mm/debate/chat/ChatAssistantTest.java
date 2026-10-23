package info.mm.debate.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import info.mm.debate.ai.AiModel;
import info.mm.debate.ai.AiModels;

class ChatAssistantTest {

	private final ChatAssistant assistant = new ChatAssistant(
			AiModels.of(new AiModel("grok", "Grok", "xAI", "grok-4"), new AiModel("gpt", "ChatGPT", "OpenAI", "gpt-5")),
			(model, mention) -> {
				throw new UnsupportedOperationException();
			}, null, null);

	@Test
	void findsMentionAnywhereInTheMessage() {
		assertThat(assistant.mentioned("@grok stimmt das?")).map(AiModel::name).hasValue("grok");
		assertThat(assistant.mentioned("Stimmt das, @grok?")).map(AiModel::name).hasValue("grok");
	}

	@Test
	void ignoresCase() {
		assertThat(assistant.mentioned("@GROK erklär das")).map(AiModel::name).hasValue("grok");
	}

	@Test
	void firstKnownMentionWins() {
		assertThat(assistant.mentioned("@alice frag mal @gpt und @grok")).map(AiModel::name).hasValue("gpt");
	}

	@Test
	void ignoresUnknownNamesAndMailAddresses() {
		assertThat(assistant.mentioned("@alice hallo")).isEmpty();
		assertThat(assistant.mentioned("schreib an info@grok.com")).isEmpty();
		assertThat(assistant.mentioned("@grokking ist was anderes")).isEmpty();
	}

	@Test
	void limitsQuestionsPerUserAndDebate() {
		assistant.claim("d1", "u1");
		assistant.claim("d1", "u2");
		assistant.claim("d2", "u1");
		assertThatThrownBy(() -> assistant.claim("d1", "u1")).isInstanceOf(ChatException.class)
			.hasMessageContaining("30 Sekunden");
	}

}
