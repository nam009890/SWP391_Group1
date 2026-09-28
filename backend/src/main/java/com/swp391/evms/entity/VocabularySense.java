package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "vocabulary_senses")
@Getter @Setter
public class VocabularySense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "vocabulary_id") private Vocabulary vocabulary;
    @Column(name = "part_of_speech") private String partOfSpeech;
    @Column(name = "definition_en") private String definitionEn;
    @Column(name = "meaning_vi") private String meaningVi;
    private String pronunciation;
    @Column(name = "audio_url") private String audioUrl;
    @Column(name = "sense_order") private Integer senseOrder;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
