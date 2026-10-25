package com.example.demo.study.repository;

import com.example.demo.study.entity.FlashcardStudyEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlashcardStudyEventRepository extends JpaRepository<FlashcardStudyEvent, Long> {
    Optional<FlashcardStudyEvent> findByUserIdAndRequestId(Long userId, String requestId);
    long countByUserIdAndFlashcardId(Long userId, Long flashcardId);
    long countByUserIdAndFlashcardIdAndConfidentRecallTrue(Long userId, Long flashcardId);
    List<FlashcardStudyEvent> findByUserIdAndFlashcardIdOrderByIdDesc(
            Long userId, Long flashcardId, org.springframework.data.domain.Pageable pageable);

    interface Counts {
        Long getFlashcardId();
        long getReviewCount();
        long getConfidentCount();
    }

    @Query("select e.flashcard.id as flashcardId, count(e) as reviewCount, "
            + "sum(case when e.confidentRecall = true then 1 else 0 end) as confidentCount "
            + "from FlashcardStudyEvent e where e.user.id = :uid and e.flashcard.id in :ids group by e.flashcard.id")
    List<Counts> countsForCards(@Param("uid") Long userId, @Param("ids") List<Long> flashcardIds);
}
