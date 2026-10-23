package info.mm.debate.chat;

import java.security.Principal;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Befehle und Nachholen per HTTP (Leitprinzip 6). Live kommen die Ticks per WebSocket auf
 * {@code /topic/debates/{debateId}/chat}.
 */
@RestController
@RequestMapping("/api/debates/{debateId}/chat")
class ChatController {

	private final ChatService chat;

	ChatController(ChatService chat) {
		this.chat = chat;
	}

	/** Die letzten Nachrichten und die eigenen Rechte; lesen geht auch ohne Anmeldung. */
	@GetMapping
	ChatSnapshot snapshot(@PathVariable String debateId, Principal principal) {
		return chat.snapshot(debateId, ChatUser.of(principal));
	}

	/** Alle Ticks nach {@code after}, für Lücken und nach einem Verbindungsabbruch. */
	@GetMapping("/ticks")
	List<ChatTick> ticks(@PathVariable String debateId, @RequestParam long after, Principal principal) {
		return chat.ticksAfter(debateId, ChatUser.of(principal), after);
	}

	@PostMapping("/messages")
	@ResponseStatus(HttpStatus.ACCEPTED)
	Accepted post(@PathVariable String debateId, @Valid @RequestBody PostMessage request, Principal principal) {
		ChatMessage message = chat.post(debateId, ChatUser.of(principal), request.text(), request.clientNonce());
		return new Accepted(message.id(), message.clientNonce());
	}

	@PostMapping("/messages/{messageId}/hide")
	@ResponseStatus(HttpStatus.ACCEPTED)
	void hide(@PathVariable String debateId, @PathVariable String messageId, Principal principal) {
		chat.hide(debateId, ChatUser.of(principal), messageId);
	}

	@PostMapping("/mutes")
	Muted mute(@PathVariable String debateId, @Valid @RequestBody Mute request, Principal principal) {
		Instant until = chat.mute(debateId, ChatUser.of(principal), request.userId(), request.minutes());
		return new Muted(request.userId(), until);
	}

	@ExceptionHandler
	ProblemDetail handle(ChatException e) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(e.status(), e.getMessage());
		problem.setProperty("code", e.code());
		if (e.mutedUntil() != null) {
			problem.setProperty("mutedUntil", e.mutedUntil());
		}
		return problem;
	}

	record PostMessage(@NotBlank @Size(max = ChatService.MAX_LENGTH) String text, @Size(max = 64) String clientNonce) {
	}

	record Accepted(String id, String clientNonce) {
	}

	record Mute(@NotBlank String userId, int minutes) {
	}

	record Muted(String userId, Instant until) {
	}

}
