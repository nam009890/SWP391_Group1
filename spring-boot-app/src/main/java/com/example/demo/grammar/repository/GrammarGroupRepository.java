package com.example.demo.grammar.repository;

import com.example.demo.grammar.entity.GrammarGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrammarGroupRepository extends JpaRepository<GrammarGroup, Long> {

    List<GrammarGroup> findAllByOrderByCreatedAtAsc();

    Optional<GrammarGroup> findByGroupKey(String groupKey);

    List<GrammarGroup> findByAuthorEmailIgnoreCase(String authorEmail);
}
