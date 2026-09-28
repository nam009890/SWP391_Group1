package com.swp391.evms.repository;

import com.swp391.evms.entity.UserVocabulary;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserVocabularyRepository extends JpaRepository<UserVocabulary, Long> {
    @Query("select uv from UserVocabulary uv join fetch uv.user join fetch uv.vocabulary where uv.user.id = :userId and (uv.learningStatus = com.swp391.evms.entity.LearningStatus.WEAK or uv.manualWeak = true)")
    List<UserVocabulary> findWeakByUserId(@Param("userId") Long userId);
}
