package info.mm.debate.ai;

import java.util.List;

/** Antwortet ohne Onyx mit einem festen Text und einer Beispielquelle, nach kurzer Wartezeit wie ein echter Aufruf. */
class FakeAiGateway implements AiGateway {

	static final String PROMPT_VERSION = "fake";

	@Override
	public AiAnswer answerChatMention(AiModel model, ChatMention mention) {
		try {
			Thread.sleep(1500);
		}
		catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
		String text = "Testantwort, Onyx ist noch nicht angebunden. Zur Debatte „" + mention.topic()
				+ "“ würde ich hier deine Frage beantworten: „" + mention.question() + "“";
		return new AiAnswer(text, List.of(new AiAnswer.Source("Beispielquelle (Attrappe)", "https://example.org")),
				PROMPT_VERSION);
	}

}
