package info.mm.debate.exception;

/**
 * Exception thrown when a user tries to perform an action they are not authorized to perform.
 * For example, when trying to close a debate they didn't create.
 */
public class UnauthorizedException extends RuntimeException {
    
    public UnauthorizedException(String message) {
        super(message);
    }
    
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}

