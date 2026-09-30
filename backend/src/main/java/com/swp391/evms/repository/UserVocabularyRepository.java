package com.swp391.evms.repository;

import com.swp391.evms.entity.UserVocabulary;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserVocabularyRepository extends JpaRepository<UserVocabulary, Long> {
    @Query("select uv from UserVocabulary uv join fetch uv.user join fetch uv.vocabulary where uv.user.id = :userId and coalesce(uv.weakDeleted, false) = false and (uv.learningStatus = com.swp391.evms.entity.LearningStatus.WEAK or uv.manualWeak = true) and (:keyword is null or lower(uv.vocabulary.word) like lower(concat('%', :keyword, '%')) or exists (select s from VocabularySense s where s.vocabulary = uv.vocabulary and lower(coalesce(s.meaningVi, '')) like lower(concat('%', :keyword, '%'))))")
    List<UserVocabulary> findVisibleWeakByUserId(@Param("userId") Long userId, @Param("keyword") String keyword);
}
