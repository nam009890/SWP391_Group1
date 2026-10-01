package com.example.demo.grammar.repository;

import com.example.demo.grammar.entity.GrammarQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrammarQuestionRepository extends JpaRepository<GrammarQuestion, Long> {

    List<GrammarQuestion> findAllByOrderByCreatedAtAsc();

    Optional<GrammarQuestion> findByQuestionKey(String questionKey);
}
