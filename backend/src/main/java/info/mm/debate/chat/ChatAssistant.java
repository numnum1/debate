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
	static final String FAILED_TEXT = "Ich kann gerade nicht antworten. Versuch es gleich noch einmal.";
	static final String BUSY_TEXT = "Gerade sind zu viele Fragen offen. Versuch es gleich noch einmal.";

	// Wie bei X: das @ steht am Anfang oder nach einem Leerzeichen/Satzzeichen, nicht mitten in einer Mail-Adresse
	private static final Pattern MENTION = Pattern.compile("(?<![\\p{L}\\p{N}_@.])@([\\p{L}\\p{N}_]{1,32})");

	private static final Logger log = LoggerFactory.getLogger(ChatAssistant.class);

	private final AiModels models;
	private final AiGateway gateway;
	private final ChatMessages messages;
	private final ChatTicker ticker;
	private final Clock clock = Clock.systemUTC();
	/** Letzte Frage an eine KI je Debatte und Nutzer */
	private final Map<String, Instant> lastQuestion = new ConcurrentHashMap<>();
	// Begrenzt, damit ein voller Chat Onyx nicht mit Aufrufen überschwemmt
	private final ThreadPoolExecutor executor = new ThreadPoolExecutor(4, 4, 0, TimeUnit.MILLISECONDS,
			new ArrayBlockingQueue<>(32), Thread.ofPlatform().name("chat-ai-", 0).daemon().factory());

	ChatAssistant(AiModels models, AiGateway gateway, ChatMessages messages, ChatTicker ticker) {
		this.models = models;
		this.gateway = gateway;
		this.messages = messages;
		this.ticker = ticker;
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
			ticker.post(reply(question, model, BUSY_TEXT, List.of(), null));
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
			reply = reply(question, model, FAILED_TEXT, List.of(), null);
		}
		// Wurde die Frage inzwischen ausgeblendet, soll die Antwort sie nicht wieder sichtbar machen
		if (messages.find(question.debateId(), question.id()).map(ChatMessage::hidden).orElse(false)) {
			return;
		}
		ticker.post(reply);
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
