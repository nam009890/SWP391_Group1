package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "vocabulary_examples")
@Getter @Setter
public class VocabularyExample {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "sense_id") private VocabularySense sense;
    @Column(name = "example_text") private String exampleText;
    @Column(name = "translation_vi") private String translationVi;
    @Column(name = "example_order") private Integer exampleOrder;
    @Column(name = "created_at") private OffsetDateTime createdAt;
}
