package info.mm.debate.repository;

import info.mm.debate.model.Debate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DebateRepository extends MongoRepository<Debate, String> {
    
    // Finde alle Debatten nach Creator
    List<Debate> findByCreatorId(String creatorId);
    
    // Finde alle Debatten nach Status
    List<Debate> findByStatus(Debate.DebateStatus status);
    
    // Finde alle Debatten, bei denen ein Benutzer Teilnehmer ist
    List<Debate> findByParticipantIdsContaining(String userId);
    
    // Finde Debatten nach Titel (Case-insensitive)
    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    List<Debate> findByTitleContainingIgnoreCase(String title);
    
    // Finde alle offenen Debatten
    List<Debate> findByStatusOrderByCreatedAtDesc(Debate.DebateStatus status);
    
    // Zähle Debatten nach Status
    long countByStatus(Debate.DebateStatus status);
}

