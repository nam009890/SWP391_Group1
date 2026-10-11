package com.example.demo.grammar.repository;

import com.example.demo.grammar.entity.GrammarGroup;
import com.example.demo.grammar.entity.GrammarQuestionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrammarQuestionReportRepository extends JpaRepository<GrammarQuestionReport, Long> {

    Optional<GrammarQuestionReport> findByReportKey(String reportKey);

    List<GrammarQuestionReport> findByAuthorEmailIgnoreCaseOrderByCreatedAtDesc(String authorEmail);

    List<GrammarQuestionReport> findByGroup(GrammarGroup group);
}
