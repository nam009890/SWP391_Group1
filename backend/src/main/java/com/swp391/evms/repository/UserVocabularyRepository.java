package com.swp391.evms.repository;

import com.swp391.evms.entity.UserVocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserVocabularyRepository
        extends JpaRepository<UserVocabulary, Long>, JpaSpecificationExecutor<UserVocabulary> {
}
