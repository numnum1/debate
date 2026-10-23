package info.mm.debate.ai;

import java.util.List;

/**
 * Antwort einer KI-Aufgabe.
 *
 * @param promptVersion gespeichert zu jeder Ausgabe, damit sich später nachvollziehen lässt, wie sie entstand
 */
public record AiAnswer(String text, List<Source> sources, String promptVersion) {

	public AiAnswer {
		sources = sources == null ? List.of() : List.copyOf(sources);
	}

	public record Source(String title, String url) {
	}

}
