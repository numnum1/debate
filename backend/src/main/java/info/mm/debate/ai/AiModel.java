package info.mm.debate.ai;

/**
 * Ein Sprachmodell, das sich im Chat mit {@code @name} rufen lässt.
 *
 * @param name Name hinter dem @, klein geschrieben, z. B. {@code grok}
 * @param displayName so steht es im Chat, z. B. „Grok“
 * @param provider Anzeigename des LLM-Anbieters, wie er in Onyx eingerichtet ist
 * @param version Modellname beim Anbieter
 */
public record AiModel(String name, String displayName, String provider, String version) {
}
