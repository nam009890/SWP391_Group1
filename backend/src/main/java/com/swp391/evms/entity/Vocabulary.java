package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "vocabularies")
@Getter @Setter
public class Vocabulary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String word;
    @Column(name = "normalized_word") private String normalizedWord;
    @Column(name = "cefr_level") private String cefrLevel;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
