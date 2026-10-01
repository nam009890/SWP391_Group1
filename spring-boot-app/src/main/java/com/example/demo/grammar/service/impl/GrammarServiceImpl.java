package com.example.demo.grammar.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.grammar.dto.GrammarQuestionDto;
import com.example.demo.grammar.entity.GrammarQuestion;
import com.example.demo.grammar.repository.GrammarQuestionRepository;
import com.example.demo.grammar.service.GrammarService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrammarServiceImpl implements GrammarService {

    private final GrammarQuestionRepository repository;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void initDefaultData() {
        try {
            if (repository.count() == 0) {
                log.info("Seeding default grammar questions into database...");
                seedDefaultQuestions();
            }
        } catch (Exception e) {
            log.warn("Database may not be initialized yet for seeding grammar questions: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarQuestionDto> getAllQuestions() {
        List<GrammarQuestion> entities = repository.findAllByOrderByCreatedAtAsc();
        List<GrammarQuestionDto> list = new ArrayList<>();
        for (GrammarQuestion entity : entities) {
            list.add(toDto(entity));
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarQuestionDto getQuestionById(Long id) {
        GrammarQuestion entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarQuestion not found with id: " + id));
        return toDto(entity);
    }

    @Override
    @Transactional
    public GrammarQuestionDto createQuestion(GrammarQuestionDto dto) {
        GrammarQuestion entity = toEntity(dto);
        if (entity.getQuestionKey() == null || entity.getQuestionKey().isEmpty()) {
            entity.setQuestionKey("cau_" + System.currentTimeMillis());
        }
        GrammarQuestion saved = repository.save(entity);
        return toDto(saved);
    }

    @Override
    @Transactional
    public GrammarQuestionDto updateQuestion(Long id, GrammarQuestionDto dto) {
        GrammarQuestion entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarQuestion not found with id: " + id));

        entity.setTitle(dto.getTitle());
        entity.setQuestionType(dto.getType());
        entity.setInstruction(dto.getInstruction());
        entity.setCorrection(dto.getCorrection());
        entity.setCorrectTokenId(dto.getCorrectTokenId());
        entity.setErrorType(dto.getErrorType());
        entity.setHint(dto.getHint());
        entity.setExplanation(dto.getExplanation());

        // Update payload JSON
        Map<String, Object> payload = new HashMap<>();
        if (dto.getTokens() != null) payload.put("tokens", dto.getTokens());
        if (dto.getTemplate() != null) payload.put("template", dto.getTemplate());
        if (dto.getBlanks() != null) payload.put("blanks", dto.getBlanks());
        if (dto.getValidation() != null) payload.put("validation", dto.getValidation());

        try {
            entity.setPayloadJson(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.error("Failed to serialize grammar question payload: {}", e.getMessage());
        }

        GrammarQuestion updated = repository.save(entity);
        return toDto(updated);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("GrammarQuestion not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByQuestionKeyOrId(String key) {
        try {
            Long numericId = Long.parseLong(key);
            if (repository.existsById(numericId)) {
                repository.deleteById(numericId);
                return;
            }
        } catch (NumberFormatException ignored) {}

        repository.findByQuestionKey(key).ifPresent(repository::delete);
    }

    @Override
    @Transactional
    public List<GrammarQuestionDto> resetToDefaults() {
        repository.deleteAll();
        seedDefaultQuestions();
        return getAllQuestions();
    }

    private void seedDefaultQuestions() {
        // Question 1: Spot the Error
        Map<String, Object> q1Payload = new HashMap<>();
        List<Map<String, Object>> q1Tokens = List.of(
                Map.of("id", 1, "text", "She"),
                Map.of("id", 2, "text", "go"),
                Map.of("id", 3, "text", "to school"),
                Map.of("id", 4, "text", "yesterday.")
        );
        q1Payload.put("tokens", q1Tokens);

        GrammarQuestion q1 = GrammarQuestion.builder()
                .questionKey("cau_1_tim_loi_sai")
                .title("Câu 1: Tìm Lỗi Sai - Thì Quá Khứ Đơn")
                .questionType("SPOT_ERROR")
                .instruction("Chỉ ra từ bị sai trong câu sau:")
                .correctTokenId(2)
                .correction("went")
                .errorType("Thì quá khứ đơn / Tương hợp thời gian")
                .hint("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu.")
                .explanation("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở quá khứ đơn là 'went'.")
                .payloadJson(writeJson(q1Payload))
                .build();

        // Question 2: Fill Blank Text
        Map<String, Object> q2Payload = new HashMap<>();
        q2Payload.put("template", "If I {1} enough money, I {2} a new house.");
        q2Payload.put("blanks", Map.of(
                "1", Map.of("hint", "have", "accepted_answers", List.of("had")),
                "2", Map.of("hint", "buy", "accepted_answers", List.of("would buy", "'d buy"))
        ));
        q2Payload.put("validation", Map.of("strict_case", false, "ignore_extra_whitespace", true));

        GrammarQuestion q2 = GrammarQuestion.builder()
                .questionKey("cau_2_dien_dong_tu")
                .title("Câu 2: Điền Từ - Câu Điều Kiện Loại 2")
                .questionType("FILL_BLANK_TEXT")
                .instruction("Điền dạng đúng của động từ trong ngoặc:")
                .explanation("Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).")
                .payloadJson(writeJson(q2Payload))
                .build();

        // Question 3: Dropdown
        Map<String, Object> q3Payload = new HashMap<>();
        q3Payload.put("template", "They have lived in Vietnam {1} 3 years.");
        q3Payload.put("blanks", Map.of(
                "1", Map.of("options", List.of("since", "for", "from", "during"), "correct_answer", "for")
        ));

        GrammarQuestion q3 = GrammarQuestion.builder()
                .questionKey("cau_3_chon_gioi_tu")
                .title("Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành")
                .questionType("FILL_BLANK_DROPDOWN")
                .instruction("Chọn từ thích hợp để hoàn thành câu:")
                .explanation("Dùng 'for' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành.")
                .payloadJson(writeJson(q3Payload))
                .build();

        // Question 4: Cards
        Map<String, Object> q4Payload = new HashMap<>();
        q4Payload.put("template", "She has been living here {1} 2015.");
        q4Payload.put("blanks", Map.of(
                "1", Map.of("options", List.of("Since", "For", "From", "During"), "correct_answer", "Since")
        ));

        GrammarQuestion q4 = GrammarQuestion.builder()
                .questionKey("cau_4_chon_the_dap_an")
                .title("Câu 4: Chọn Thẻ Đáp Án - Hiện Tại Hoàn Thành Tiếp Diễn")
                .questionType("FILL_BLANK_CARDS")
                .instruction("Chọn thẻ đáp án đúng để hoàn thành câu:")
                .explanation("Dùng 'Since' đi kèm với mốc thời gian xác định trong quá khứ (2015) trong thì Hiện tại hoàn thành tiếp diễn.")
                .payloadJson(writeJson(q4Payload))
                .build();

        repository.saveAll(List.of(q1, q2, q3, q4));
        log.info("Default grammar questions seeded successfully.");
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    private GrammarQuestionDto toDto(GrammarQuestion entity) {
        GrammarQuestionDto.GrammarQuestionDtoBuilder builder = GrammarQuestionDto.builder()
                .id(entity.getQuestionKey() != null ? entity.getQuestionKey() : entity.getId().toString())
                .dbId(entity.getId())
                .title(entity.getTitle())
                .type(entity.getQuestionType())
                .instruction(entity.getInstruction())
                .correctTokenId(entity.getCorrectTokenId())
                .correction(entity.getCorrection())
                .errorType(entity.getErrorType())
                .hint(entity.getHint())
                .explanation(entity.getExplanation());

        if (entity.getPayloadJson() != null && !entity.getPayloadJson().isEmpty()) {
            try {
                Map<String, Object> payload = objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
                if (payload.containsKey("tokens")) builder.tokens(payload.get("tokens"));
                if (payload.containsKey("template")) builder.template((String) payload.get("template"));
                if (payload.containsKey("blanks")) builder.blanks(payload.get("blanks"));
                if (payload.containsKey("validation")) builder.validation(payload.get("validation"));
            } catch (Exception e) {
                log.warn("Failed to parse payloadJson for question {}: {}", entity.getId(), e.getMessage());
            }
        }

        return builder.build();
    }

    private GrammarQuestion toEntity(GrammarQuestionDto dto) {
        String key = dto.getId() != null ? dto.getId().toString() : ("cau_" + System.currentTimeMillis());

        Map<String, Object> payload = new HashMap<>();
        if (dto.getTokens() != null) payload.put("tokens", dto.getTokens());
        if (dto.getTemplate() != null) payload.put("template", dto.getTemplate());
        if (dto.getBlanks() != null) payload.put("blanks", dto.getBlanks());
        if (dto.getValidation() != null) payload.put("validation", dto.getValidation());

        return GrammarQuestion.builder()
                .questionKey(key)
                .title(dto.getTitle())
                .questionType(dto.getType())
                .instruction(dto.getInstruction())
                .correctTokenId(dto.getCorrectTokenId())
                .correction(dto.getCorrection())
                .errorType(dto.getErrorType())
                .hint(dto.getHint())
                .explanation(dto.getExplanation())
                .payloadJson(writeJson(payload))
                .build();
    }
}
