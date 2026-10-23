package info.mm.debate.chat;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Prüft STOMP-Frames vom Client: Beim {@code CONNECT} ist ein Keycloak-Token optional (ohne Token liest man
 * anonym), beim {@code SUBSCRIBE} gelten dieselben Leserechte wie per HTTP; die eigenen Hinweise
 * ({@code /user/queue/chat}) gibt es nur mit Anmeldung. {@code SEND} gibt es nicht.
 */
@Component
class ChatSubscriptionGuard implements ChannelInterceptor {

	private static final Pattern CHAT_TOPIC = Pattern.compile("^/topic/debates/([^/]+)/chat$");
	private static final String NOTICE_QUEUE = "/user" + ChatNotices.QUEUE;

	private final JwtDecoder jwtDecoder;
	private final ChatService chat;

	ChatSubscriptionGuard(JwtDecoder jwtDecoder, ChatService chat) {
		this.jwtDecoder = jwtDecoder;
		this.chat = chat;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null || accessor.getCommand() == null) {
			return message;
		}
		StompCommand command = accessor.getCommand();
		if (command == StompCommand.CONNECT) {
			String authorization = accessor.getFirstNativeHeader("Authorization");
			if (authorization != null && authorization.startsWith("Bearer ")) {
				// Ein ungültiges Token beendet die Verbindung; der Client verbindet sich mit einem frischen neu
				accessor.setUser(new JwtAuthenticationToken(jwtDecoder.decode(authorization.substring(7))));
			}
		}
		else if (command == StompCommand.SUBSCRIBE) {
			if (NOTICE_QUEUE.equals(accessor.getDestination())) {
				// Eigene Hinweise; Spring stellt sie nur an die Sitzung des jeweiligen Nutzers zu
				if (accessor.getUser() == null) {
					throw new MessageDeliveryException("Hinweise gibt es nur mit Anmeldung");
				}
				return message;
			}
			Matcher matcher = CHAT_TOPIC.matcher(String.valueOf(accessor.getDestination()));
			if (!matcher.matches()) {
				throw new MessageDeliveryException("Unbekanntes Ziel: " + accessor.getDestination());
			}
			if (!chat.access(matcher.group(1), ChatUser.of(accessor.getUser())).canRead()) {
				throw new MessageDeliveryException("Kein Zugriff auf diesen Chat");
			}
		}
		else if (command == StompCommand.SEND) {
			throw new MessageDeliveryException("Nachrichten werden per HTTP gesendet");
		}
		return message;
	}

}
