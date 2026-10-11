package com.example.demo.grammar.service;

import com.example.demo.grammar.dto.AuthorDto;
import com.example.demo.grammar.dto.GrammarGroupDto;
import com.example.demo.grammar.dto.GrammarQuestionDto;
import com.example.demo.grammar.dto.GrammarReportDto;
import com.example.demo.grammar.dto.GrammarResponseDto;
import com.example.demo.grammar.entity.GrammarGroup;
import com.example.demo.grammar.entity.GrammarQuestion;
import com.example.demo.grammar.entity.GrammarQuestionReport;
import com.example.demo.grammar.repository.GrammarGroupRepository;
import com.example.demo.grammar.repository.GrammarQuestionReportRepository;
import com.example.demo.grammar.repository.GrammarQuestionRepository;
import com.example.demo.grammar.service.impl.GrammarServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GrammarServiceImplTest {

    private GrammarGroupRepository groupRepository;
    private GrammarQuestionRepository questionRepository;
    private GrammarQuestionReportRepository reportRepository;
    private ObjectMapper objectMapper;
    private GrammarServiceImpl service;

    private GrammarGroup sampleGroup;
    private GrammarQuestion sampleQuestion;

    @BeforeEach
    void setUp() {
        groupRepository = mock(GrammarGroupRepository.class);
        questionRepository = mock(GrammarQuestionRepository.class);
        reportRepository = mock(GrammarQuestionReportRepository.class);
        objectMapper = new ObjectMapper();

        service = new GrammarServiceImpl(groupRepository, questionRepository, reportRepository, objectMapper);

        sampleGroup = GrammarGroup.builder()
                .id(1L)
                .groupKey("group_test_01")
                .title("Test 1")
                .description("Bài kiểm tra ngữ pháp mẫu")
                .authorName("StudyE Official")
                .authorEmail("buiquangviet032@gmail.com")
                .questions(new ArrayList<>())
                .reports(new ArrayList<>())
                .build();

        sampleQuestion = GrammarQuestion.builder()
                .id(10L)
                .group(sampleGroup)
                .questionKey("cau_1_tim_loi_sai")
                .title("Câu 1: Tìm lỗi sai")
                .questionType("SPOT_ERROR")
                .instruction("Chỉ ra từ bị sai:")
                .correctTokenId(2)
                .correction("went")
                .errorType("Quá khứ đơn")
                .payloadJson("{\"tokens\":[{\"id\":1,\"text\":\"She\"},{\"id\":2,\"text\":\"go\"}]}")
                .build();

        sampleGroup.getQuestions().add(sampleQuestion);
    }

    @Test
    void testGetAllDataReturnsGroupsAndQuestions() {
        when(groupRepository.findAllByOrderByCreatedAtAsc()).thenReturn(List.of(sampleGroup));

        GrammarResponseDto response = service.getAllData();

        assertNotNull(response);
        assertEquals("grammar_test_series", response.getLessonId());
        assertEquals(1, response.getGroups().size());

        GrammarGroupDto groupDto = response.getGroups().get(0);
        assertEquals("group_test_01", groupDto.getId());
        assertEquals("Test 1", groupDto.getTitle());
        assertEquals(1, groupDto.getQuestions().size());
        assertEquals("cau_1_tim_loi_sai", groupDto.getQuestions().get(0).getId());
    }

    @Test
    void testCreateGroupPersistsNewGroup() {
        GrammarGroupDto input = GrammarGroupDto.builder()
                .id("group_custom_01")
                .title("Test Tùy Chỉnh")
                .description("Bài tập ôn tập riêng")
                .author(AuthorDto.builder().name("Giáo viên A").email("teacher@studye.local").build())
                .build();

        when(groupRepository.save(any(GrammarGroup.class))).thenAnswer(invocation -> {
            GrammarGroup g = invocation.getArgument(0);
            g.setId(99L);
            return g;
        });

        GrammarGroupDto created = service.createGroup(input);

        assertNotNull(created);
        assertEquals("group_custom_01", created.getId());
        assertEquals("Test Tùy Chỉnh", created.getTitle());
        assertEquals("Giáo viên A", created.getAuthor().getName());
        verify(groupRepository).save(any(GrammarGroup.class));
    }

    @Test
    void testGetGroupByIdNumericAndKey() {
        when(groupRepository.findByGroupKey("group_test_01")).thenReturn(Optional.of(sampleGroup));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(sampleGroup));

        GrammarGroupDto byKey = service.getGroupById("group_test_01");
        assertNotNull(byKey);
        assertEquals("Test 1", byKey.getTitle());

        GrammarGroupDto byId = service.getGroupById("1");
        assertNotNull(byId);
        assertEquals("Test 1", byId.getTitle());
    }

    @Test
    void testDeleteGroupCallsRepository() {
        when(groupRepository.findByGroupKey("group_test_01")).thenReturn(Optional.of(sampleGroup));

        service.deleteGroup("group_test_01");

        verify(groupRepository).delete(sampleGroup);
    }

    @Test
    void testCreateQuestionAttachesToGroup() {
        when(groupRepository.findByGroupKey("group_test_01")).thenReturn(Optional.of(sampleGroup));
        when(questionRepository.save(any(GrammarQuestion.class))).thenAnswer(invocation -> {
            GrammarQuestion q = invocation.getArgument(0);
            q.setId(101L);
            return q;
        });

        GrammarQuestionDto input = GrammarQuestionDto.builder()
                .id("cau_moi_01")
                .groupId("group_test_01")
                .title("Câu hỏi mới")
                .type("FILL_BLANK_TEXT")
                .instruction("Điền vào chỗ trống")
                .template("I {1} English.")
                .explanation("Giải thích")
                .build();

        GrammarQuestionDto created = service.createQuestion(input);

        assertNotNull(created);
        assertEquals("cau_moi_01", created.getId());
        assertEquals("FILL_BLANK_TEXT", created.getType());
        verify(questionRepository).save(any(GrammarQuestion.class));
    }

    @Test
    void testUpdateQuestionModifiesFields() {
        when(questionRepository.findById(10L)).thenReturn(Optional.of(sampleQuestion));
        when(questionRepository.save(any(GrammarQuestion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GrammarQuestionDto update = GrammarQuestionDto.builder()
                .title("Câu 1 đã sửa")
                .type("SPOT_ERROR")
                .correction("had gone")
                .explanation("Đã cập nhật")
                .build();

        GrammarQuestionDto updated = service.updateQuestion(10L, update);

        assertNotNull(updated);
        assertEquals("Câu 1 đã sửa", updated.getTitle());
        assertEquals("had gone", updated.getCorrection());
        assertEquals("Đã cập nhật", updated.getExplanation());
    }

    @Test
    void testCreateReportAndResolve() {
        when(groupRepository.findByGroupKey("group_test_01")).thenReturn(Optional.of(sampleGroup));

        GrammarQuestionReport report = GrammarQuestionReport.builder()
                .id(50L)
                .reportKey("rep_123")
                .group(sampleGroup)
                .questionKey("cau_1_tim_loi_sai")
                .questionTitle("Câu 1: Tìm lỗi sai")
                .errorType("Sai đáp án")
                .description("Đáp án câu này chưa chuẩn")
                .reporterEmail("student@studye.local")
                .authorEmail("buiquangviet032@gmail.com")
                .status("PENDING")
                .build();

        when(reportRepository.save(any(GrammarQuestionReport.class))).thenReturn(report);
        when(reportRepository.findByReportKey("rep_123")).thenReturn(Optional.of(report));

        GrammarReportDto input = GrammarReportDto.builder()
                .id("rep_123")
                .groupId("group_test_01")
                .questionId("cau_1_tim_loi_sai")
                .questionTitle("Câu 1: Tìm lỗi sai")
                .errorType("Sai đáp án")
                .description("Đáp án câu này chưa chuẩn")
                .reporterEmail("student@studye.local")
                .build();

        GrammarReportDto createdReport = service.createReport(input);
        assertNotNull(createdReport);
        assertEquals("rep_123", createdReport.getId());
        assertEquals("PENDING", createdReport.getStatus());

        GrammarReportDto resolvedReport = service.resolveReport("rep_123");
        assertNotNull(resolvedReport);
        assertEquals("RESOLVED", resolvedReport.getStatus());
    }

    @Test
    void testGetReportsForAuthor() {
        GrammarQuestionReport report = GrammarQuestionReport.builder()
                .id(50L)
                .reportKey("rep_123")
                .group(sampleGroup)
                .authorEmail("buiquangviet032@gmail.com")
                .status("PENDING")
                .build();

        when(reportRepository.findByAuthorEmailIgnoreCaseOrderByCreatedAtDesc("buiquangviet032@gmail.com"))
                .thenReturn(List.of(report));

        List<GrammarReportDto> list = service.getReportsForAuthor("buiquangviet032@gmail.com");

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("rep_123", list.get(0).getId());
    }
}
