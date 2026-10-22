package info.mm.debate;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** Prüft ohne laufende Infrastruktur, dass die Module nur über erlaubte Schnittstellen voneinander abhängen. */
class DebateBackendApplicationTests {

	@Test
	void modulesAreWellFormed() {
		ApplicationModules.of(DebateBackendApplication.class).verify();
	}

}
