package info.mm.debate.ai;

import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Einstellungen unter {@code debate.ai}.
 *
 * @param models Name hinter dem @ → Modell in Onyx
 */
@ConfigurationProperties("debate.ai")
record AiProperties(Onyx onyx, Map<String, Model> models) {

	AiProperties {
		models = models == null ? Map.of() : Map.copyOf(models);
	}

	/**
	 * @param apiKey leer heißt: Onyx ist nicht angebunden, es antwortet eine Attrappe
	 * @param personaId Agent in Onyx, dessen Tools (z. B. Websuche) der Aufruf verwendet
	 * @param toolIds nur diese Tools des Agents; leer heißt alle
	 */
	record Onyx(String url, String apiKey, int personaId, List<Integer> toolIds) {

		Onyx {
			toolIds = toolIds == null ? List.of() : List.copyOf(toolIds);
		}

	}

	record Model(String displayName, String provider, String version) {
	}

}
