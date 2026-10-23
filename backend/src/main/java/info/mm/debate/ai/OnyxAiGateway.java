package info.mm.debate.ai;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Ruft Onyx headless auf ({@code POST /chat/send-chat-message}, ohne Streaming). Jeder Aufruf ist eine neue
 * Onyx-Sitzung; das Modell wählen wir pro Aufruf über {@code llm_override}.
 */
class OnyxAiGateway implements AiGateway {

	/** Bei jeder Änderung am Prompt hochzählen; die Version wird zu jeder Antwort gespeichert. */
	static final String CHAT_MENTION_PROMPT_VERSION = "chat-mention-1";
	static final int MAX_SOURCES = 3;

	private final RestClient http;
	private final int personaId;
	private final List<Integer> toolIds;

	OnyxAiGateway(AiProperties.Onyx onyx) {
		HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
		JdkClientHttpRequestFactory requests = new JdkClientHttpRequestFactory(client);
		requests.setReadTimeout(Duration.ofSeconds(90));
		this.http = RestClient.builder()
			.baseUrl(onyx.url())
			.requestFactory(requests)
			.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + onyx.apiKey())
			.build();
		this.personaId = onyx.personaId();
		this.toolIds = onyx.toolIds();
	}

	@Override
	public AiAnswer answerChatMention(AiModel model, ChatMention mention) {
		Map<String, Object> request = new LinkedHashMap<>();
		request.put("message", mention.question());
		request.put("additional_context", chatMentionInstructions(model, mention));
		request.put("llm_override", Map.of("model_provider", model.provider(), "model_version", model.version()));
		request.put("chat_session_info", Map.of("persona_id", personaId));
		if (!toolIds.isEmpty()) {
			request.put("allowed_tool_ids", toolIds);
		}
		request.put("stream", false);

		Response response = http.post()
			.uri("/chat/send-chat-message")
			.contentType(MediaType.APPLICATION_JSON)
			.body(request)
			.retrieve()
			.body(Response.class);
		if (response == null || response.errorMsg() != null || response.answer() == null) {
			throw new IllegalStateException(
					"Onyx hat nicht geantwortet: " + (response == null ? "leere Antwort" : response.errorMsg()));
		}
		String text = response.answerCitationless() != null ? response.answerCitationless() : response.answer();
		return new AiAnswer(text.strip(), sources(response), CHAT_MENTION_PROMPT_VERSION);
	}

	static String chatMentionInstructions(AiModel model, ChatMention mention) {
		return """
				Du bist %s, eine KI im öffentlichen Live-Chat einer Debatte. Zuschauer rufen dich mit @%s.
				Die Debatte: „%s“. Seite A: %s. Seite B: %s. Sie läuft auf %s, Phase: %s.
				Regeln:
				- Antworte in der Sprache der Frage, kurz: höchstens drei Sätze, unter 600 Zeichen, ohne Markdown.
				- Bleib sachlich und ausgewogen und ergreife keine Partei.
				- Gib keine Wetttipps und sag nicht voraus, wer gewinnt oder wie die Jury entscheidet.
				- Prüfe Fakten mit der Websuche. Wenn du etwas nicht sicher weißt, sag das.
				- Du kennst weder den übrigen Chat noch das, was im Stream gesagt wird, nur diese eine Nachricht.
				""".formatted(model.displayName(), model.name(), mention.topic(), mention.sideA(), mention.sideB(),
				mention.platform(), mention.phase());
	}

	/** Nur Dokumente, die die Antwort auch zitiert, und nur solche mit Link. */
	private static List<AiAnswer.Source> sources(Response response) {
		Set<String> cited = new HashSet<>();
		if (response.citationInfo() != null) {
			response.citationInfo().forEach(citation -> cited.add(citation.documentId()));
		}
		if (response.topDocuments() == null) {
			return List.of();
		}
		return response.topDocuments().stream()
			.filter(doc -> cited.contains(doc.documentId()) && doc.link() != null && !doc.link().isBlank())
			.map(doc -> new AiAnswer.Source(doc.semanticIdentifier(), doc.link()))
			.distinct()
			.limit(MAX_SOURCES)
			.toList();
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Response(
			String answer,
			@JsonProperty("answer_citationless") String answerCitationless,
			@JsonProperty("top_documents") List<Document> topDocuments,
			@JsonProperty("citation_info") List<Citation> citationInfo,
			@JsonProperty("error_msg") String errorMsg) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Document(
			@JsonProperty("document_id") String documentId,
			@JsonProperty("semantic_identifier") String semanticIdentifier,
			String link) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Citation(@JsonProperty("document_id") String documentId) {
	}

}
