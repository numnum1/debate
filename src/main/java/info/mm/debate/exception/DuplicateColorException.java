package info.mm.debate.exception;

/**
 * Exception thrown when trying to add or update a position with a color that is already used by another position.
 */
public class DuplicateColorException extends RuntimeException {
    
    public DuplicateColorException(String message) {
        super(message);
    }
    
    public DuplicateColorException(String message, Throwable cause) {
        super(message, cause);
    }
}

