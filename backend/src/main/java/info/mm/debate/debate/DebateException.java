package info.mm.debate.debate;

import org.springframework.http.HttpStatus;

/**
 * Fachlicher Fehler beim Anlegen einer Debatte mit einem Code und dem betroffenen Feld, die der Client auswertet
 * (z. B. {@code INVALID_STREAM_URL} bei {@code streamUrl}).
 */
class DebateException extends RuntimeException {

	private final HttpStatus status;
	private final String code;
	private final String field;

	DebateException(HttpStatus status, String code, String field, String message) {
		super(message);
		this.status = status;
		this.code = code;
		this.field = field;
	}

	static DebateException invalid(String code, String field, String message) {
		return new DebateException(HttpStatus.BAD_REQUEST, code, field, message);
	}

	HttpStatus status() {
		return status;
	}

	String code() {
		return code;
	}

	String field() {
		return field;
	}

}
