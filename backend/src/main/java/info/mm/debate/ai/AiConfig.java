package info.mm.debate.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
class AiConfig {

	private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

	/** Ohne API-Key antwortet eine Attrappe, damit der Chat lokal auch ohne eingerichtetes Onyx funktioniert. */
	@Bean
	AiGateway aiGateway(AiProperties properties) {
		AiProperties.Onyx onyx = properties.onyx();
		if (onyx == null || onyx.apiKey() == null || onyx.apiKey().isBlank()) {
			log.warn("Kein Onyx-API-Key gesetzt (ONYX_API_KEY): KI-Antworten kommen von einer Attrappe");
			return new FakeAiGateway();
		}
		return new OnyxAiGateway(onyx);
	}

}
