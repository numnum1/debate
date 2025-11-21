package info.mm.debate.repository;

import info.mm.debate.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Find users by name (case-insensitive, partial match)
     */
    List<User> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find user by exact name
     */
    Optional<User> findByName(String name);
    
    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);
}

