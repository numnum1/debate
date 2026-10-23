package info.mm.debate.ai;

/**
 * Eine Frage an die KI aus dem Chat, mit dem, was sie über die Debatte wissen darf. Den übrigen Chat und Namen von
 * Nutzern bekommt sie nicht (Quoten, Wetten und Chat gehen nie an Onyx).
 *
 * @param question die Nachricht mit dem @name, so wie sie im Chat steht
 */
public record ChatMention(String question, String topic, String sideA, String sideB, String platform,
		String phase) {
}
