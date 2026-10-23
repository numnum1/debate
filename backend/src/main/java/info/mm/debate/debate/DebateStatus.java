package info.mm.debate.debate;

/**
 * Phase im Lebenszyklus einer Debatte.
 * {@link #LEAD_IN} wird nie gespeichert: Er ergibt sich aus {@link #BETTING}, sobald der Wettschluss erreicht ist.
 */
public enum DebateStatus {

	/** Angelegt, Wetten noch nicht offen */
	SCHEDULED,
	/** Regelwerk gesperrt, Wetten offen */
	BETTING,
	/** Vorlauf: Wettschluss erreicht, Debatte noch nicht live */
	LEAD_IN,
	LIVE,
	/** Die Jury berät */
	VERDICT,
	SETTLED,
	CANCELLED

}
