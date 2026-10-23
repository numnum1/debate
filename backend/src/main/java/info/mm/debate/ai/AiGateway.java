package info.mm.debate.ai;

/**
 * Unsere Schnittstelle zur KI. Sie kennt nur unsere Aufgabenarten, damit ein Wechsel der Onyx-API nur die
 * Implementierung trifft. Aufrufe dauern Sekunden und blockieren; Aufrufer führen sie nicht im Request-Thread aus.
 */
public interface AiGateway {

	/** Beantwortet eine Frage, die jemand im Chat mit {@code @name} gestellt hat. */
	AiAnswer answerChatMention(AiModel model, ChatMention mention);

}
