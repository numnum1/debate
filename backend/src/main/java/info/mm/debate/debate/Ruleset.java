package info.mm.debate.debate;

/**
 * Regelwerk einer Debatte: ein Template mit den Einstellungen, die der Host im POC ändern darf. Alles Übrige aus
 * PRODUKT.md steht fest im Template "standard". Gesperrt wird es erst, wenn die Wetten öffnen.
 *
 * @param jurors Größe der Jury; ungerade, damit der Median ein Juror-Urteil ist
 * @param locked gesperrt, sobald die Wetten offen sind
 */
public record Ruleset(String template, int jurors, Evidence evidence, PointBets pointBets, boolean locked) {

	public static final String STANDARD = "standard";

	public static Ruleset standard() {
		return new Ruleset(STANDARD, 3, Evidence.CLOSED, PointBets.OFF, false);
	}

	/** Was Juroren berücksichtigen dürfen: nur das Gesagte, oder auch Faktenchecks und Notizen. */
	public enum Evidence {
		CLOSED,
		OPEN
	}

	/** Point Bets: aus, oder nur vom Host vorgegebene. */
	public enum PointBets {
		OFF,
		PRESET
	}

}
