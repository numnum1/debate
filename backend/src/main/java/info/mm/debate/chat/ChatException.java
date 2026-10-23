package info.mm.debate.chat;

import java.time.Instant;

import org.springframework.http.HttpStatus;

/**
 * Fachlicher Fehler im Chat mit einem Code, den der Client auswertet (z. B. {@code MUTED}).
 *
 * @param mutedUntil nur bei {@code MUTED}
 */
class ChatException extends RuntimeException {

	private final HttpStatus status;
	private final String code;
	private final Instant mutedUntil;

	ChatException(HttpStatus status, String code, String message) {
		this(status, code, message, null);
	}

	ChatException(HttpStatus status, String code, String message, Instant mutedUntil) {
		super(message);
		this.status = status;
		this.code = code;
		this.mutedUntil = mutedUntil;
	}

	HttpStatus status() {
		return status;
	}

	String code() {
		return code;
	}

	Instant mutedUntil() {
		return mutedUntil;
	}

}
