package com.swp391.evms.repository;

import com.swp391.evms.entity.VocabularyExample;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VocabularyExampleRepository extends JpaRepository<VocabularyExample, Long> {
    List<VocabularyExample> findBySenseIdOrderByExampleOrderAsc(Long senseId);
}
