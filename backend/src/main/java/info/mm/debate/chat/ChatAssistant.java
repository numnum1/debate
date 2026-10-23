package info.mm.debate.chat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import info.mm.debate.ai.AiAnswer;
import info.mm.debate.ai.AiGateway;
import info.mm.debate.ai.AiModel;
import info.mm.debate.ai.AiModels;
import info.mm.debate.ai.ChatMention;
import info.mm.debate.chat.ChatMessage.AiOrigin;
import info.mm.debate.chat.ChatMessage.ReplyTo;
import info.mm.debate.chat.ChatMessage.Source;
import info.mm.debate.debate.Debate;

import jakarta.annotation.PreDestroy;

/**
 * KI im Chat, wie Grok auf X: Wer {@code @grok …} schreibt, bekommt eine öffentliche Antwort im Chat. Pro Nachricht
 * antwortet nur die erste genannte KI. Die Antwort läuft im Hintergrund und kommt mit einem späteren Tick.
 */
@Component
class ChatAssistant {

	static final Duration COOLDOWN = Duration.ofSeconds(30);
	static final int MAX_ANSWER_LENGTH = 1000;
	static final int EXCERPT_LENGTH = 80;
	/** Steht als {@code hiddenBy} an Fragen, die entfernt wurden, weil die KI nicht antworten konnte */
	static final String HIDDEN_UNAVAILABLE = "system:ai-unavailable";

	// Wie bei X: das @ steht am Anfang oder nach einem Leerzeichen/Satzzeichen, nicht mitten in einer Mail-Adresse
	private static final Pattern MENTION = Pattern.compile("(?<![\\p{L}\\p{N}_@.])@([\\p{L}\\p{N}_]{1,32})");

	private static final Logger log = LoggerFactory.getLogger(ChatAssistant.class);

	private final AiModels models;
	private final AiGateway gateway;
	private final ChatMessages messages;
	private final ChatTicker ticker;
	private final ChatNotices notices;
	private final Clock clock = Clock.systemUTC();
	/** Letzte Frage an eine KI je Debatte und Nutzer */
	private final Map<String, Instant> lastQuestion = new ConcurrentHashMap<>();
	// Begrenzt, damit ein voller Chat Onyx nicht mit Aufrufen überschwemmt
	private final ThreadPoolExecutor executor = new ThreadPoolExecutor(4, 4, 0, TimeUnit.MILLISECONDS,
			new ArrayBlockingQueue<>(32), Thread.ofPlatform().name("chat-ai-", 0).daemon().factory());

	ChatAssistant(AiModels models, AiGateway gateway, ChatMessages messages, ChatTicker ticker,
			ChatNotices notices) {
		this.models = models;
		this.gateway = gateway;
		this.messages = messages;
		this.ticker = ticker;
		this.notices = notices;
	}

	List<AiModel> models() {
		return models.all();
	}

	/** Die erste KI, die im Text mit {@code @name} genannt ist. */
	Optional<AiModel> mentioned(String text) {
		Matcher matcher = MENTION.matcher(text);
		while (matcher.find()) {
			Optional<AiModel> model = models.find(matcher.group(1));
			if (model.isPresent()) {
				return model;
			}
		}
		return Optional.empty();
	}

	/** Prüft das Limit für Fragen an die KI und zählt diese Frage mit; gilt auch für Host und Moderatoren. */
	void claim(String debateId, String userId) {
		Instant now = clock.instant();
		String key = debateId + ":" + userId;
		Instant previous = lastQuestion.get(key);
		if (previous != null && previous.plus(COOLDOWN).isAfter(now)) {
			throw new ChatException(HttpStatus.TOO_MANY_REQUESTS, "AI_TOO_FAST",
					"Die KI kannst du nur alle " + COOLDOWN.toSeconds() + " Sekunden fragen.");
		}
		lastQuestion.put(key, now);
	}

	/** Stellt die Frage im Hintergrund und schickt die Antwort in den Chat. */
	void answerLater(Debate debate, ChatMessage question, AiModel model) {
		ChatMention mention = new ChatMention(question.text(), debate.topic(), debate.sideA(), debate.sideB(),
				debate.platform() == null ? "unbekannt" : debate.platform().name(),
				debate.statusAt(clock.instant()).name());
		try {
			executor.execute(() -> answer(question, model, mention));
		}
		catch (RejectedExecutionException e) {
			log.warn("Zu viele offene KI-Fragen, @{} auf Nachricht {} abgewiesen", model.name(), question.id());
			unavailable(question, model);
		}
	}

	private void answer(ChatMessage question, AiModel model, ChatMention mention) {
		ChatMessage reply;
		try {
			AiAnswer answer = gateway.answerChatMention(model, mention);
			List<Source> sources = answer.sources().stream().map(s -> new Source(s.title(), s.url())).toList();
			reply = reply(question, model, truncate(answer.text(), MAX_ANSWER_LENGTH), sources,
					new AiOrigin(model.provider() + "/" + model.version(), answer.promptVersion()));
		}
		catch (RuntimeException e) {
			log.warn("KI-Antwort von @{} auf Nachricht {} fehlgeschlagen", model.name(), question.id(), e);
			unavailable(question, model);
			return;
		}
		// Wurde die Frage inzwischen ausgeblendet, soll die Antwort sie nicht wieder sichtbar machen
		if (messages.find(question.debateId(), question.id()).map(ChatMessage::hidden).orElse(false)) {
			return;
		}
		ticker.post(reply);
	}

	/**
	 * Kann die KI nicht antworten (Fehler beim Anbieter, Rate-Limit, zu viele offene Fragen), verschwindet die Frage
	 * aus dem Chat und nur der Fragende erfährt, warum. Ausgeblendet statt gelöscht, damit sich jeder Tick weiter
	 * nachholen lässt; die Nachricht läuft im selben Strom wie die Frage, also nie vor ihr.
	 */
	private void unavailable(ChatMessage question, AiModel model) {
		ticker.hide(question.debateId(), question.id(), HIDDEN_UNAVAILABLE);
		notices.send(question.userId(), new ChatNotices.Notice(question.debateId(),
				model.displayName() + " ist gerade nicht verfügbar. Deine Nachricht wurde aus dem Chat entfernt.",
				question.id(), clock.instant()));
	}

	private ChatMessage reply(ChatMessage question, AiModel model, String text, List<Source> sources, AiOrigin ai) {
		return new ChatMessage(new ObjectId().toHexString(), question.debateId(), 0, 0, "ai:" + model.name(),
				model.displayName(), ChatBadge.AI, text, null, clock.instant(), null, null,
				new ReplyTo(question.id(), question.userName(), truncate(question.text(), EXCERPT_LENGTH)), sources, ai);
	}

	private static String truncate(String text, int max) {
		return text.length() <= max ? text : text.substring(0, max - 1).stripTrailing() + "…";
	}

	@PreDestroy
	void stop() {
		executor.shutdownNow();
	}

}
