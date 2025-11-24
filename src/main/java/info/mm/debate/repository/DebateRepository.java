package info.mm.debate.repository;

import info.mm.debate.model.Debate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebateRepository extends MongoRepository<Debate, String> {
    
    // Finde alle Debatten nach Status
    List<Debate> findByStatus(Debate.DebateStatus status);
    
    // Finde Debatten nach Titel (Case-insensitive)
    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    List<Debate> findByTitleContainingIgnoreCase(String title);
    
    // Finde alle Debatten nach Status sortiert nach Erstellungsdatum
    List<Debate> findByStatusOrderByCreatedAtDesc(Debate.DebateStatus status);
    
    // Zähle Debatten nach Status
    long countByStatus(Debate.DebateStatus status);
    
    // Finde alle öffentlichen Debatten
    List<Debate> findByIsPublicOrderByCreatedAtDesc(Boolean isPublic);
    
    // Finde öffentliche Debatten nach Status
    List<Debate> findByIsPublicAndStatusOrderByCreatedAtDesc(Boolean isPublic, Debate.DebateStatus status);
    
    // Finde Debatten nach Tag
    @Query("{ 'tags': { $in: [?0] } }")
    List<Debate> findByTag(String tag);
    
    // Finde Debatten die alle angegebenen Tags enthalten
    @Query("{ 'tags': { $all: ?0 } }")
    List<Debate> findByAllTags(List<String> tags);
    
    // Finde Debatten die mindestens einen der angegebenen Tags enthalten
    @Query("{ 'tags': { $in: ?0 } }")
    List<Debate> findByAnyTags(List<String> tags);
}

