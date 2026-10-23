package info.mm.debate.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import info.mm.debate.ai.AiModel;
import info.mm.debate.ai.AiModels;
import info.mm.debate.debate.Debate;
import info.mm.debate.debate.DebateStatus;

class ChatAssistantTest {

	private final ChatAssistant assistant = new ChatAssistant(
			AiModels.of(new AiModel("grok", "Grok", "xAI", "grok-4"), new AiModel("gpt", "ChatGPT", "OpenAI", "gpt-5")),
			(model, mention) -> {
				throw new UnsupportedOperationException();
			}, null, null, null);

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
	void removesQuestionAndTellsOnlyTheAskerWhenTheAiFails() {
		ChatTicker ticker = mock(ChatTicker.class);
		ChatNotices notices = mock(ChatNotices.class);
		AiModel grok = new AiModel("grok", "Grok", "xAI", "grok-4");
		ChatAssistant failing = new ChatAssistant(AiModels.of(grok), (model, mention) -> {
			throw new IllegalStateException("Rate Limit Exceeded");
		}, mock(ChatMessages.class), ticker, notices);
		ChatMessage question = ChatMessage.fromUser("m1", "d1", new ChatUser("u1", "Alice", false), null,
				"@grok stimmt das?", null, Instant.now());
		Debate debate = new Debate("d1", "Thema", "A", "B", null, null, DebateStatus.LIVE, Instant.now(),
				Instant.now(), List.of());

		failing.answerLater(debate, question, grok);

		verify(ticker, timeout(2000)).hide("d1", "m1", ChatAssistant.HIDDEN_UNAVAILABLE);
		ArgumentCaptor<ChatNotices.Notice> notice = ArgumentCaptor.forClass(ChatNotices.Notice.class);
		verify(notices, timeout(2000)).send(eq("u1"), notice.capture());
		assertThat(notice.getValue().text()).startsWith("Grok ist gerade nicht verfügbar");
		verify(ticker, never()).post(any());
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
