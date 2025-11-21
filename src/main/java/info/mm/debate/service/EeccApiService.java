package info.mm.debate.service;

import info.mm.debate.dto.EeccChatRequest;
import info.mm.debate.dto.EeccChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Service für EECC API-Aufrufe
 */
@Service
@Slf4j
public class EeccApiService {
    
    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String baseUrl;
    
    public EeccApiService(
            @Value("${eecc.api.base-url:https://api.eecc.ai/v1}") String baseUrl,
            @Value("${eecc.api.key}") String apiKey
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.restTemplate = new RestTemplate();
        
        log.info("EECC API Service initialized with base URL: {}", baseUrl);
    }
    
    /**
     * Sendet eine Chat Completion Anfrage an die EECC API
     * 
     * @param request Die Chat-Anfrage
     * @return Die Response der EECC API
     */
    public EeccChatResponse createChatCompletion(EeccChatRequest request) {
        log.debug("Sending chat completion request to EECC API for model: {}", request.getModel());
        
        try {
            // HTTP Headers erstellen
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            // HTTP Entity mit Request-Body und Headers
            HttpEntity<EeccChatRequest> entity = new HttpEntity<>(request, headers);
            
            // API-Aufruf durchführen
            String url = baseUrl + "/chat/completions";
            ResponseEntity<EeccChatResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    EeccChatResponse.class
            );
            
            EeccChatResponse responseBody = response.getBody();
            
            if (responseBody != null) {
                log.info("Successfully received response from EECC API. Model: {}, Tokens used: {}",
                        responseBody.getModel(),
                        responseBody.getUsage() != null ? responseBody.getUsage().getTotalTokens() : "N/A");
            }
            
            return responseBody;
            
        } catch (RestClientException e) {
            log.error("Error calling EECC API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to call EECC API: " + e.getMessage(), e);
        }
    }
}

