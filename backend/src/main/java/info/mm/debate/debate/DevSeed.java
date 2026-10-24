package info.mm.debate.debate;

import static info.mm.debate.debate.DebateRole.HOST;
import static info.mm.debate.debate.DebateRole.JUROR;
import static info.mm.debate.debate.DebateRole.MODERATOR;
import static info.mm.debate.debate.DebateRole.RESOLVER;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import info.mm.debate.debate.Debate.RoleAssignment;

/**
 * Nur lokal: Legt Beispieldebatten mit Rollen für die Testnutzer an, damit nach dem Start etwas zu sehen ist.
 * Debatten, die schon existieren, bleiben unangetastet; die IDs entsprechen den Mock-Daten im Frontend.
 */
@Component
@Profile("dev")
class DevSeed implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DevSeed.class);

	// Feste IDs der Testnutzer aus infra/keycloak/debate-realm.json
	static final String ALICE = "00000000-0000-4000-8000-000000000002";
	static final String BOB = "00000000-0000-4000-8000-000000000003";
	static final String CAROL = "00000000-0000-4000-8000-000000000004";
	static final String DAVE = "00000000-0000-4000-8000-000000000005";
	static final String ERIN = "00000000-0000-4000-8000-000000000006";
	static final String FRANK = "00000000-0000-4000-8000-000000000007";

	private final DebateRepository repository;

	DevSeed(DebateRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(ApplicationArguments args) {
		List<Debate> missing = new ArrayList<>();
		for (Debate debate : debates(Instant.now())) {
			if (!repository.existsById(debate.id())) {
				missing.add(debate);
			}
		}
		repository.saveAll(missing);
		if (!missing.isEmpty()) {
			log.info("Dev-Seed: {} Beispieldebatten angelegt", missing.size());
		}
	}

	static List<Debate> debates(Instant now) {
		return List.of(
			debate(now, "grundeinkommen", "Bedingungsloses Grundeinkommen: Ist Deutschland bereit?", "Lena Hartmann",
					"Jonas Weber", "Politik", Platform.YOUTUBE, DebateStatus.LIVE, -34,
					role(CAROL, HOST), role(BOB, MODERATOR), role(DAVE, JUROR), role(ERIN, JUROR), role(FRANK, RESOLVER)),
			debate(now, "kernkraft", "Kernkraft zurück ins Netz?", "Dr. Sven Krüger", "Aylin Demir", "Energie",
					Platform.TWITCH, DebateStatus.BETTING, 95,
					role(CAROL, HOST), role(BOB, JUROR)),
			debate(now, "ki-urheberrecht", "Darf KI mit urheberrechtlich geschützten Werken trainiert werden?",
					"Mara Lindqvist", "Felix Brandt", "Technologie", Platform.YOUTUBE, DebateStatus.SCHEDULED, 60 * 26,
					role(CAROL, HOST)),
			debate(now, "tempolimit", "Tempolimit 130 auf Autobahnen", "Thomas Albrecht", "Nora Schulz", "Verkehr",
					Platform.TWITCH, DebateStatus.LIVE, -12,
					role(CAROL, HOST), role(ALICE, MODERATOR)),
			debate(now, "vier-tage-woche", "Vier-Tage-Woche für alle", "Clara Neumann", "Peter Haas", "Wirtschaft",
					Platform.YOUTUBE, DebateStatus.LIVE, -71,
					role(CAROL, HOST), role(FRANK, MODERATOR)),
			debate(now, "schach-ki", "Ist Schach durch KI tot?", "GM Daniel Roth", "Lisa Kowalski", "Sport", Platform.X,
					DebateStatus.LIVE, -5,
					role(CAROL, HOST), role(ALICE, RESOLVER)),
			debate(now, "wehrpflicht", "Rückkehr der Wehrpflicht", "Martin Vogel", "Sophie Richter", "Politik",
					Platform.YOUTUBE, DebateStatus.VERDICT, -110,
					role(CAROL, HOST), role(ALICE, JUROR), role(DAVE, JUROR), role(ERIN, JUROR)),
			debate(now, "homeoffice", "Homeoffice-Pflicht für Bürojobs", "Katrin Lehmann", "Ben Fischer", "Wirtschaft",
					Platform.TWITCH, DebateStatus.BETTING, 60 * 5,
					role(ALICE, HOST)),
			debate(now, "mietendeckel", "Bundesweiter Mietendeckel", "Hannah Meier", "Oliver Schmitt", "Politik",
					Platform.YOUTUBE, DebateStatus.SCHEDULED, 60 * 50,
					role(CAROL, HOST), role(ALICE, JUROR)),
			debate(now, "mars", "Sollten wir zuerst den Mars besiedeln oder die Erde retten?", "Elias Wolf",
					"Miriam Koch", "Wissenschaft", Platform.TWITCH, DebateStatus.SETTLED, -60 * 27,
					role(CAROL, HOST)),
			debate(now, "social-media-alter", "Social Media erst ab 16", "Julia Becker", "Tim Hoffmann", "Gesellschaft",
					Platform.YOUTUBE, DebateStatus.SETTLED, -60 * 52,
					role(ALICE, HOST)),
			debate(now, "fleischsteuer", "Steuer auf Fleisch", "Anna Schäfer", "Lukas Zimmermann", "Gesellschaft",
					Platform.TWITCH, DebateStatus.CANCELLED, -60 * 30,
					role(CAROL, HOST)));
	}

	/** Startzeit relativ zu jetzt in Minuten; Wettschluss wie vorgeschlagen 30 Minuten vor dem Start. */
	private static Debate debate(Instant now, String id, String topic, String sideA, String sideB, String category,
			Platform platform, DebateStatus status, int startsInMinutes, RoleAssignment... roles) {
		Instant startsAt = now.plus(Duration.ofMinutes(startsInMinutes));
		return new Debate(id, topic, sideA, sideB, category, platform, null, status, startsAt,
				startsAt.minus(Duration.ofMinutes(30)), null, List.of(roles));
	}

	private static RoleAssignment role(String userId, DebateRole role) {
		return new RoleAssignment(userId, role);
	}

}
