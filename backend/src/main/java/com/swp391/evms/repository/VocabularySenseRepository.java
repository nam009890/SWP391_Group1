package com.swp391.evms.repository;

import com.swp391.evms.entity.VocabularySense;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VocabularySenseRepository extends JpaRepository<VocabularySense, Long> {
    List<VocabularySense> findByVocabularyIdOrderBySenseOrderAsc(Long vocabularyId);
}
