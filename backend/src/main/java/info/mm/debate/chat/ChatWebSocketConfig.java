package info.mm.debate.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket mit STOMP und eingebautem Broker. Clients abonnieren nur; Befehle laufen per HTTP (Leitprinzip 6).
 * Für den POC reicht eine Instanz; bei mehreren käme ein externer Broker dazu.
 */
@Configuration
@EnableWebSocketMessageBroker
@EnableScheduling
class ChatWebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final ChatSubscriptionGuard guard;
	private TaskScheduler heartbeatScheduler;

	ChatWebSocketConfig(ChatSubscriptionGuard guard) {
		this.guard = guard;
	}

	@Autowired
	void setHeartbeatScheduler(@Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler scheduler) {
		this.heartbeatScheduler = scheduler;
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		// Im Browser kommt die Verbindung über den Vite-Proxy, der Origin ist also das Frontend auf localhost
		registry.addEndpoint("/api/ws").setAllowedOriginPatterns("http://localhost:[*]");
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// /topic für alle einer Debatte, /queue für Hinweise an einzelne Nutzer (abonniert als /user/queue/...).
		// Heartbeats alle 10 s in beide Richtungen, damit tote Verbindungen auffallen
		registry.enableSimpleBroker("/topic", "/queue")
			.setHeartbeatValue(new long[] { 10_000, 10_000 })
			.setTaskScheduler(heartbeatScheduler);
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(guard);
	}

}
