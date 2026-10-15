package com.example.demo.grammar.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.grammar.dto.*;
import com.example.demo.grammar.entity.GrammarGroup;
import com.example.demo.grammar.entity.GrammarQuestion;
import com.example.demo.grammar.entity.GrammarQuestionReport;
import com.example.demo.grammar.repository.GrammarGroupRepository;
import com.example.demo.grammar.repository.GrammarQuestionReportRepository;
import com.example.demo.grammar.repository.GrammarQuestionRepository;
import com.example.demo.grammar.service.GrammarService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class GrammarServiceImpl implements GrammarService {

    private final GrammarGroupRepository groupRepository;
    private final GrammarQuestionRepository questionRepository;
    private final GrammarQuestionReportRepository reportRepository;
    private final ObjectMapper objectMapper;

    public GrammarServiceImpl(
            GrammarGroupRepository groupRepository,
            GrammarQuestionRepository questionRepository,
            GrammarQuestionReportRepository reportRepository,
            ObjectMapper objectMapper
    ) {
        this.groupRepository = groupRepository;
        this.questionRepository = questionRepository;
        this.reportRepository = reportRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void initDefaultData() {
        try {
            if (groupRepository.count() == 0) {
                log.info("Seeding default grammar test groups and questions into database...");
                seedDefaultData();
            } else {
                fixCorruptedVietnameseData();
            }
        } catch (Exception e) {
            log.warn("Database may not be initialized yet for seeding grammar groups: {}", e.getMessage());
        }
    }

    private void fixCorruptedVietnameseData() {
        try {
            List<GrammarQuestion> allQuestions = questionRepository.findAll();
            boolean needSaveQuestion = false;
            for (GrammarQuestion q : allQuestions) {
                if (q.getQuestionKey() == null) continue;
                switch (q.getQuestionKey()) {
                    case "cau_1_tim_loi_sai":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 1: Tìm Lỗi Sai - Thì Quá Khứ Đơn");
                            q.setInstruction("Chỉ ra từ bị sai trong câu sau:");
                            q.setErrorType("Thì quá khứ đơn / Tương hợp thời gian");
                            q.setHint("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu (yesterday).");
                            q.setExplanation("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở thì quá khứ đơn là 'went'.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_2_hien_tai_don":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 2: Điền Từ - Thì Hiện Tại Đơn");
                            q.setInstruction("Hoàn thành câu bằng cách điền từ thích hợp:");
                            q.setExplanation("Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She).");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_3_chon_gioi_tu":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành");
                            q.setInstruction("Chọn từ thích hợp từ danh sách thả xuống:");
                            q.setExplanation("Dùng 'for' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_4_chon_the_dap_an":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 4: Chọn Từ Thả Xuống - Hiện Tại Hoàn Thành Tiếp Diễn");
                            q.setInstruction("Chọn từ thích hợp từ danh sách thả xuống:");
                            q.setExplanation("Dùng 'Since' đi kèm với mốc thời gian xác định trong quá khứ (2015) trong thì Hiện tại hoàn thành tiếp diễn.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_cond_1":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 1: Điền Động Từ - Câu Điều Kiện Loại 2");
                            q.setInstruction("Điền dạng đúng của động từ trong ngoặc:");
                            q.setExplanation("Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_cond_2":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 2: Tìm Lỗi Sai - Mệnh Đề If Loại 1");
                            q.setInstruction("Chỉ ra từ bị sai trong câu điều kiện sau:");
                            q.setErrorType("Câu điều kiện loại 1 / Mệnh đề If");
                            q.setHint("Mệnh đề If loại 1 không dùng 'will'.");
                            q.setExplanation("Trong câu điều kiện loại 1, mệnh đề If chia thì Hiện tại đơn ('rains'), không dùng 'will rain'.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_cond_3":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 3: Chọn Từ Trắc Nghiệm - Câu Điều Kiện Loại 0");
                            q.setInstruction("Chọn từ đúng diễn tả chân lý hiển nhiên:");
                            q.setExplanation("Câu điều kiện loại 0 diễn tả sự thật hiển nhiên: Cả 2 vế đều dùng thì Hiện tại đơn (heat / melts).");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_prep_1":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 1: Chọn Từ Thả Xuống - Giới Từ Đi Kèm Tính Từ");
                            q.setInstruction("Chọn từ thích hợp từ danh sách thả xuống:");
                            q.setExplanation("Cấu trúc cố định: 'to be interested in something' (thích thú, quan tâm đến điều gì).");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_prep_2":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 2: Điền Giới Từ - Giới Từ Chỉ Thời Gian");
                            q.setInstruction("Điền giới từ chỉ thời gian thích hợp:");
                            q.setExplanation("Dùng 'at' trước mốc giờ cụ thể (at 9:00 AM) và 'on' trước ngày/thứ trong tuần (on Monday).");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_img_1":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 1: Quan sát hình ảnh lớp học");
                            q.setInstruction("Quan sát bức ảnh bên dưới và chọn câu miêu tả chính xác nhất:");
                            q.setExplanation("Bức ảnh thể hiện không gian lớp học sống động, giáo viên đang trao đổi và học sinh đang chú ý lắng nghe.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_cloze_1":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 2: Đoạn văn điền từ về Lợi ích đọc sách");
                            q.setInstruction("Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:");
                            q.setExplanation("[1] 'allows' mang nghĩa tạo điều kiện / cho phép. [2] 'developing a reading habit' là danh động từ số ít nên chia 'has been proven'.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_reading_1":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 3: Đọc hiểu - Trí Tuệ Nhân Tạo (AI)");
                            q.setInstruction("Đọc kỹ đoạn văn sau và trả lời các câu hỏi bên dưới:");
                            q.setExplanation("Đoạn văn nhấn mạnh ứng dụng thực tiễn của AI (gợi ý nội dung) và sự cần thiết của quy chuẩn đạo đức nhằm bảo vệ quyền riêng tư người dùng.");
                            needSaveQuestion = true;
                        }
                        break;
                    case "cau_audio_1":
                        if (isCorrupted(q.getInstruction()) || isCorrupted(q.getTitle())) {
                            q.setTitle("Câu 4: Nghe thông báo sân bay (Audio Listening)");
                            q.setInstruction("Nghe thông báo âm thanh và chọn câu trả lời chính xác:");
                            q.setExplanation("Thông báo ghi rõ: 'Flight VN382 to Da Nang is now boarding at Gate 4'.");
                            needSaveQuestion = true;
                        }
                        break;
                }
            }
            if (needSaveQuestion) {
                questionRepository.saveAll(allQuestions);
                log.info("Successfully repaired corrupted Vietnamese grammar question texts in database.");
            }

            List<GrammarGroup> allGroups = groupRepository.findAll();
            boolean needSaveGroup = false;
            for (GrammarGroup g : allGroups) {
                if (g.getGroupKey() == null) continue;
                switch (g.getGroupKey()) {
                    case "group_test_01":
                        if (isCorrupted(g.getDescription()) || isCorrupted(g.getTitle())) {
                            g.setTitle("Test 1");
                            g.setDescription("Bài kiểm tra tổng hợp: Thì Quá khứ, Hiện tại đơn, Menu thả xuống");
                            needSaveGroup = true;
                        }
                        break;
                    case "group_test_02":
                        if (isCorrupted(g.getDescription()) || isCorrupted(g.getTitle())) {
                            g.setTitle("Test 2");
                            g.setDescription("Bài kiểm tra chuyên đề: Câu điều kiện loại 1 & loại 2");
                            needSaveGroup = true;
                        }
                        break;
                    case "group_test_03":
                        if (isCorrupted(g.getDescription()) || isCorrupted(g.getTitle())) {
                            g.setTitle("Test 3");
                            g.setDescription("Bài kiểm tra: Giới từ, Cụm tính từ và Cấu trúc thường gặp");
                            needSaveGroup = true;
                        }
                        break;
                    case "group_test_04":
                        if (isCorrupted(g.getDescription()) || isCorrupted(g.getTitle())) {
                            g.setTitle("Test 4");
                            g.setDescription("Bài kiểm tra nâng cao: Hình ảnh, Đoạn văn điền từ, Đọc hiểu văn bản & Nghe Audio");
                            needSaveGroup = true;
                        }
                        break;
                }
            }
            if (needSaveGroup) {
                groupRepository.saveAll(allGroups);
                log.info("Successfully repaired corrupted Vietnamese grammar group descriptions in database.");
            }
        } catch (Exception e) {
            log.warn("Could not check/repair corrupted Vietnamese text: {}", e.getMessage());
        }
    }

    private boolean isCorrupted(String text) {
        if (text == null) return false;
        return text.contains("?") || text.contains("Ð") || text.contains("d?ng");
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarResponseDto getAllData() {
        List<GrammarGroup> groups = groupRepository.findAllByOrderByCreatedAtAsc();
        List<GrammarGroupDto> groupDtos = new ArrayList<>();
        for (GrammarGroup g : groups) {
            groupDtos.add(toGroupDto(g));
        }

        return GrammarResponseDto.builder()
                .lessonId("grammar_test_series")
                .lessonTitle("Ngân Hàng Bài Tập Ngữ Pháp")
                .groups(groupDtos)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarGroupDto> getAllGroups() {
        List<GrammarGroup> groups = groupRepository.findAllByOrderByCreatedAtAsc();
        List<GrammarGroupDto> list = new ArrayList<>();
        for (GrammarGroup g : groups) {
            list.add(toGroupDto(g));
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarGroupDto getGroupById(String groupKeyOrId) {
        GrammarGroup group = findGroupByKeyOrId(groupKeyOrId);
        return toGroupDto(group);
    }

    @Override
    @Transactional
    public GrammarGroupDto createGroup(GrammarGroupDto dto) {
        String key = dto.getId() != null && !dto.getId().trim().isEmpty()
                ? dto.getId().trim()
                : "group_" + System.currentTimeMillis();

        String authorName = dto.getAuthor() != null ? dto.getAuthor().getName() : "StudyE Official";
        String authorEmail = dto.getAuthor() != null ? dto.getAuthor().getEmail() : "community@studye.edu.vn";

        GrammarGroup entity = GrammarGroup.builder()
                .groupKey(key)
                .title(dto.getTitle() != null ? dto.getTitle().trim() : "Bài kiểm tra")
                .description(dto.getDescription())
                .icon(dto.getIcon() != null ? dto.getIcon() : "")
                .authorName(authorName)
                .authorEmail(authorEmail)
                .build();

        GrammarGroup saved = groupRepository.save(entity);
        return toGroupDto(saved);
    }

    @Override
    @Transactional
    public void deleteGroup(String groupKeyOrId) {
        GrammarGroup group = findGroupByKeyOrId(groupKeyOrId);
        groupRepository.delete(group);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarQuestionDto getQuestionById(Long id) {
        GrammarQuestion entity = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarQuestion not found with id: " + id));
        return toQuestionDto(entity);
    }

    @Override
    @Transactional
    public GrammarQuestionDto createQuestion(GrammarQuestionDto dto) {
        GrammarGroup group = null;
        if (dto.getGroupId() != null && !dto.getGroupId().trim().isEmpty()) {
            group = groupRepository.findByGroupKey(dto.getGroupId()).orElse(null);
            if (group == null) {
                try {
                    Long groupIdNum = Long.parseLong(dto.getGroupId());
                    group = groupRepository.findById(groupIdNum).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
        }

        if (group == null) {
            List<GrammarGroup> all = groupRepository.findAllByOrderByCreatedAtAsc();
            if (!all.isEmpty()) {
                group = all.get(0);
            } else {
                group = groupRepository.save(GrammarGroup.builder()
                        .groupKey("group_test_01")
                        .title("Test 1")
                        .description("Bài kiểm tra tổng hợp")
                        .authorName("StudyE Official")
                        .authorEmail("buiquangviet032@gmail.com")
                        .build());
            }
        }

        GrammarQuestion entity = toQuestionEntity(dto, group);
        if (entity.getQuestionKey() == null || entity.getQuestionKey().isEmpty()) {
            entity.setQuestionKey("cau_" + System.currentTimeMillis());
        }

        GrammarQuestion saved = questionRepository.save(entity);
        return toQuestionDto(saved);
    }

    @Override
    @Transactional
    public GrammarQuestionDto updateQuestion(Long id, GrammarQuestionDto dto) {
        GrammarQuestion entity = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarQuestion not found with id: " + id));

        if (dto.getTitle() != null) entity.setTitle(dto.getTitle());
        if (dto.getType() != null) entity.setQuestionType(dto.getType());
        if (dto.getInstruction() != null) entity.setInstruction(dto.getInstruction());
        if (dto.getCorrection() != null) entity.setCorrection(dto.getCorrection());
        if (dto.getCorrectTokenId() != null) entity.setCorrectTokenId(dto.getCorrectTokenId());
        if (dto.getErrorType() != null) entity.setErrorType(dto.getErrorType());
        if (dto.getHint() != null) entity.setHint(dto.getHint());
        if (dto.getExplanation() != null) entity.setExplanation(dto.getExplanation());

        // Update payload JSON
        Map<String, Object> payload = extractPayloadMap(dto);
        entity.setPayloadJson(writeJson(payload));

        GrammarQuestion updated = questionRepository.save(entity);
        return toQuestionDto(updated);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("GrammarQuestion not found with id: " + id);
        }
        questionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByQuestionKeyOrId(String keyOrId) {
        try {
            Long numericId = Long.parseLong(keyOrId);
            if (questionRepository.existsById(numericId)) {
                questionRepository.deleteById(numericId);
                return;
            }
        } catch (NumberFormatException ignored) {}

        questionRepository.findByQuestionKey(keyOrId).ifPresent(questionRepository::delete);
    }

    @Override
    @Transactional
    public GrammarReportDto createReport(GrammarReportDto dto) {
        String reportKey = dto.getId() != null && !dto.getId().trim().isEmpty()
                ? dto.getId().trim()
                : "rep_" + System.currentTimeMillis();

        String targetGroupId = dto.getGroupId() != null ? dto.getGroupId() : dto.getTestId();
        GrammarGroup group = null;
        if (targetGroupId != null) {
            group = groupRepository.findByGroupKey(targetGroupId).orElse(null);
            if (group == null) {
                try {
                    Long gId = Long.parseLong(targetGroupId);
                    group = groupRepository.findById(gId).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
        }

        GrammarQuestionReport report = GrammarQuestionReport.builder()
                .reportKey(reportKey)
                .group(group)
                .questionKey(dto.getQuestionId())
                .questionTitle(dto.getQuestionTitle())
                .errorType(dto.getErrorType())
                .description(dto.getDescription())
                .reporterName(dto.getReporterName())
                .reporterEmail(dto.getReporterEmail())
                .authorName(dto.getAuthorName() != null ? dto.getAuthorName() : (group != null ? group.getAuthorName() : null))
                .authorEmail(dto.getAuthorEmail() != null ? dto.getAuthorEmail() : (group != null ? group.getAuthorEmail() : null))
                .status("PENDING")
                .build();

        GrammarQuestionReport saved = reportRepository.save(report);
        return toReportDto(saved);
    }

    @Override
    @Transactional
    public GrammarReportDto resolveReport(String reportKeyOrId) {
        GrammarQuestionReport report = null;
        try {
            Long numId = Long.parseLong(reportKeyOrId);
            report = reportRepository.findById(numId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (report == null) {
            report = reportRepository.findByReportKey(reportKeyOrId)
                    .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportKeyOrId));
        }

        report.setStatus("RESOLVED");
        GrammarQuestionReport updated = reportRepository.save(report);
        return toReportDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarReportDto> getReportsForAuthor(String authorEmail) {
        List<GrammarQuestionReport> list = reportRepository.findByAuthorEmailIgnoreCaseOrderByCreatedAtDesc(authorEmail);
        List<GrammarReportDto> dtos = new ArrayList<>();
        for (GrammarQuestionReport r : list) {
            dtos.add(toReportDto(r));
        }
        return dtos;
    }

    @Override
    @Transactional
    public GrammarResponseDto resetToDefaults() {
        reportRepository.deleteAll();
        questionRepository.deleteAll();
        groupRepository.deleteAll();
        seedDefaultData();
        return getAllData();
    }

    private GrammarGroup findGroupByKeyOrId(String keyOrId) {
        try {
            Long id = Long.parseLong(keyOrId);
            Optional<GrammarGroup> byId = groupRepository.findById(id);
            if (byId.isPresent()) return byId.get();
        } catch (NumberFormatException ignored) {}

        return groupRepository.findByGroupKey(keyOrId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarGroup not found: " + keyOrId));
    }

    private void seedDefaultData() {
        // --- TEST 1 ---
        GrammarGroup g1 = GrammarGroup.builder()
                .groupKey("group_test_01")
                .title("Test 1")
                .description("Bài kiểm tra tổng hợp: Thì Quá khứ, Hiện tại đơn, Dropdown & Thẻ từ")
                .icon("")
                .authorName("StudyE Official")
                .authorEmail("buiquangviet032@gmail.com")
                .build();
        g1 = groupRepository.save(g1);

        Map<String, Object> q1_1Payload = Map.of(
                "tokens", List.of(
                        Map.of("id", 1, "text", "She"),
                        Map.of("id", 2, "text", "go"),
                        Map.of("id", 3, "text", "to school"),
                        Map.of("id", 4, "text", "yesterday.")
                )
        );
        GrammarQuestion q1_1 = GrammarQuestion.builder()
                .group(g1)
                .questionKey("cau_1_tim_loi_sai")
                .title("Câu 1: Tìm Lỗi Sai - Thì Quá Khứ Đơn")
                .questionType("SPOT_ERROR")
                .instruction("Chỉ ra từ bị sai trong câu sau:")
                .correctTokenId(2)
                .correction("went")
                .errorType("Thì quá khứ đơn / Tương hợp thời gian")
                .hint("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu (yesterday).")
                .explanation("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở thì quá khứ đơn là 'went'.")
                .payloadJson(writeJson(q1_1Payload))
                .build();

        Map<String, Object> q1_2Payload = Map.of(
                "template", "She usually {1} up early and {2} jogging.",
                "blanks", Map.of(
                        "1", Map.of("hint", "wake", "accepted_answers", List.of("wakes")),
                        "2", Map.of("hint", "go", "accepted_answers", List.of("goes"))
                ),
                "validation", Map.of("strict_case", false, "ignore_extra_whitespace", true)
        );
        GrammarQuestion q1_2 = GrammarQuestion.builder()
                .group(g1)
                .questionKey("cau_2_hien_tai_don")
                .title("Câu 2: Điền Từ - Thì Hiện Tại Đơn")
                .questionType("FILL_BLANK_TEXT")
                .instruction("Hoàn thành câu bằng cách điền từ thích hợp:")
                .explanation("Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She).")
                .payloadJson(writeJson(q1_2Payload))
                .build();

        Map<String, Object> q1_3Payload = Map.of(
                "template", "They have lived in Vietnam {1} 3 years.",
                "blanks", Map.of(
                        "1", Map.of("options", List.of("for", "since", "from", "during"), "correct_answer", "for")
                )
        );
        GrammarQuestion q1_3 = GrammarQuestion.builder()
                .group(g1)
                .questionKey("cau_3_chon_gioi_tu")
                .title("Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành")
                .questionType("FILL_BLANK_DROPDOWN")
                .instruction("Chọn từ thích hợp từ danh sách thả xuống:")
                .explanation("Dùng 'for' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành.")
                .payloadJson(writeJson(q1_3Payload))
                .build();

        Map<String, Object> q1_4Payload = Map.of(
                "template", "She has been living here {1} 2015.",
                "blanks", Map.of(
                        "1", Map.of("options", List.of("Since", "For", "From", "During"), "correct_answer", "Since")
                )
        );
        GrammarQuestion q1_4 = GrammarQuestion.builder()
                .group(g1)
                .questionKey("cau_4_chon_the_dap_an")
                .title("Câu 4: Chọn Từ Thả Xuống - Hiện Tại Hoàn Thành Tiếp Diễn")
                .questionType("FILL_BLANK_DROPDOWN")
                .instruction("Chọn từ thích hợp từ danh sách thả xuống:")
                .explanation("Dùng 'Since' đi kèm với mốc thời gian xác định trong quá khứ (2015) trong thì Hiện tại hoàn thành tiếp diễn.")
                .payloadJson(writeJson(q1_4Payload))
                .build();

        questionRepository.saveAll(List.of(q1_1, q1_2, q1_3, q1_4));

        // --- TEST 2 ---
        GrammarGroup g2 = GrammarGroup.builder()
                .groupKey("group_test_02")
                .title("Test 2")
                .description("Bài kiểm tra chuyên đề: Câu điều kiện loại 1 & loại 2")
                .icon("")
                .authorName("StudyE Official")
                .authorEmail("buiquangviet032@gmail.com")
                .build();
        g2 = groupRepository.save(g2);

        Map<String, Object> q2_1Payload = Map.of(
                "template", "If I {1} enough money, I {2} a new house.",
                "blanks", Map.of(
                        "1", Map.of("hint", "have", "accepted_answers", List.of("had")),
                        "2", Map.of("hint", "buy", "accepted_answers", List.of("would buy", "'d buy"))
                ),
                "validation", Map.of("strict_case", false, "ignore_extra_whitespace", true)
        );
        GrammarQuestion q2_1 = GrammarQuestion.builder()
                .group(g2)
                .questionKey("cau_cond_1")
                .title("Câu 1: Điền Động Từ - Câu Điều Kiện Loại 2")
                .questionType("FILL_BLANK_TEXT")
                .instruction("Điền dạng đúng của động từ trong ngoặc:")
                .explanation("Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).")
                .payloadJson(writeJson(q2_1Payload))
                .build();

        Map<String, Object> q2_2Payload = Map.of(
                "tokens", List.of(
                        Map.of("id", 1, "text", "If"),
                        Map.of("id", 2, "text", "it"),
                        Map.of("id", 3, "text", "will rain"),
                        Map.of("id", 4, "text", "tomorrow,"),
                        Map.of("id", 5, "text", "we will stay home.")
                )
        );
        GrammarQuestion q2_2 = GrammarQuestion.builder()
                .group(g2)
                .questionKey("cau_cond_2")
                .title("Câu 2: Tìm Lỗi Sai - Mệnh Đề If Loại 1")
                .questionType("SPOT_ERROR")
                .instruction("Chỉ ra từ bị sai trong câu điều kiện sau:")
                .correctTokenId(3)
                .correction("rains")
                .errorType("Câu điều kiện loại 1 / Mệnh đề If")
                .hint("Mệnh đề If loại 1 không dùng 'will'.")
                .explanation("Trong câu điều kiện loại 1, mệnh đề If chia thì Hiện tại đơn ('rains'), không dùng 'will rain'.")
                .payloadJson(writeJson(q2_2Payload))
                .build();

        Map<String, Object> q2_3Payload = Map.of(
                "template", "If you heat ice, it {1}.",
                "blanks", Map.of(
                        "1", Map.of("options", List.of("melts", "will melt", "melted", "would melt"), "correct_answer", "melts")
                )
        );
        GrammarQuestion q2_3 = GrammarQuestion.builder()
                .group(g2)
                .questionKey("cau_cond_3")
                .title("Câu 3: Chọn Từ Trắc Nghiệm - Câu Điều Kiện Loại 0")
                .questionType("FILL_BLANK_DROPDOWN")
                .instruction("Chọn từ đúng diễn tả chân lý hiển nhiên:")
                .explanation("Câu điều kiện loại 0 diễn tả sự thật hiển nhiên: Cả 2 vế đều dùng thì Hiện tại đơn (heat / melts).")
                .payloadJson(writeJson(q2_3Payload))
                .build();

        questionRepository.saveAll(List.of(q2_1, q2_2, q2_3));

        // --- TEST 3 ---
        GrammarGroup g3 = GrammarGroup.builder()
                .groupKey("group_test_03")
                .title("Test 3")
                .description("Bài kiểm tra: Giới từ, Cụm tính từ và Cấu trúc thường gặp")
                .icon("")
                .authorName("StudyE Official")
                .authorEmail("buiquangviet032@gmail.com")
                .build();
        g3 = groupRepository.save(g3);

        Map<String, Object> q3_1Payload = Map.of(
                "template", "They are interested {1} learning English online.",
                "blanks", Map.of(
                        "1", Map.of("options", List.of("in", "on", "at", "with"), "correct_answer", "in")
                )
        );
        GrammarQuestion q3_1 = GrammarQuestion.builder()
                .group(g3)
                .questionKey("cau_prep_1")
                .title("Câu 1: Chọn Từ Thả Xuống - Giới Từ Đi Kèm Tính Từ")
                .questionType("FILL_BLANK_DROPDOWN")
                .instruction("Chọn từ thích hợp từ danh sách thả xuống:")
                .explanation("Cấu trúc cố định: 'to be interested in something' (thích thú, quan tâm đến điều gì).")
                .payloadJson(writeJson(q3_1Payload))
                .build();

        Map<String, Object> q3_2Payload = Map.of(
                "template", "The meeting starts {1} 9:00 AM {2} Monday.",
                "blanks", Map.of(
                        "1", Map.of("hint", "giờ giấc", "accepted_answers", List.of("at")),
                        "2", Map.of("hint", "thứ trong tuần", "accepted_answers", List.of("on"))
                ),
                "validation", Map.of("strict_case", false, "ignore_extra_whitespace", true)
        );
        GrammarQuestion q3_2 = GrammarQuestion.builder()
                .group(g3)
                .questionKey("cau_prep_2")
                .title("Câu 2: Điền Giới Từ - Giới Từ Chỉ Thời Gian")
                .questionType("FILL_BLANK_TEXT")
                .instruction("Điền giới từ chỉ thời gian thích hợp:")
                .explanation("Dùng 'at' trước mốc giờ cụ thể (at 9:00 AM) và 'on' trước ngày/thứ trong tuần (on Monday).")
                .payloadJson(writeJson(q3_2Payload))
                .build();

        questionRepository.saveAll(List.of(q3_1, q3_2));

        // --- TEST 4 ---
        GrammarGroup g4 = GrammarGroup.builder()
                .groupKey("group_test_04")
                .title("Test 4")
                .description("Bài kiểm tra nâng cao: Hình ảnh, Đoạn văn điền từ, Đọc hiểu văn bản & Nghe Audio")
                .icon("")
                .authorName("StudyE Official")
                .authorEmail("buiquangviet032@gmail.com")
                .build();
        g4 = groupRepository.save(g4);

        Map<String, Object> q4_1Payload = Map.of(
                "image_url", "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
                "image_caption", "Hoạt động trong lớp học hiện đại",
                "question_text", "What are the students and teacher doing in the classroom?",
                "options", List.of(
                        "The teacher is explaining the lesson while students listen attentively.",
                        "The students are taking an exam in complete silence.",
                        "Everyone is playing outdoor sports in the school yard.",
                        "The teacher is writing a letter at the desk alone."
                ),
                "correct_answer", "The teacher is explaining the lesson while students listen attentively."
        );
        GrammarQuestion q4_1 = GrammarQuestion.builder()
                .group(g4)
                .questionKey("cau_img_1")
                .title("Câu 1: Quan sát hình ảnh lớp học")
                .questionType("IMAGE_QUESTION")
                .instruction("Quan sát bức ảnh bên dưới và chọn câu miêu tả chính xác nhất:")
                .explanation("Bức ảnh thể hiện không gian lớp học sống động, giáo viên đang trao đổi và học sinh đang chú ý lắng nghe.")
                .payloadJson(writeJson(q4_1Payload))
                .build();

        Map<String, Object> q4_2Payload = Map.of(
                "passage_title", "The Benefits of Regular Reading",
                "passage_text", "Reading books every day helps expand your vocabulary and improve your focus. It {1} you to learn new ideas and understand different cultures. Furthermore, developing a reading habit at an early age {2} proven to enhance critical thinking skills.",
                "blanks", Map.of(
                        "1", Map.of("options", List.of("allows", "forces", "forbids", "stops"), "correct_answer", "allows"),
                        "2", Map.of("options", List.of("has been", "have been", "was being", "is having"), "correct_answer", "has been")
                )
        );
        GrammarQuestion q4_2 = GrammarQuestion.builder()
                .group(g4)
                .questionKey("cau_cloze_1")
                .title("Câu 2: Đoạn văn điền từ về Lợi ích đọc sách")
                .questionType("PASSAGE_CLOZE")
                .instruction("Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:")
                .explanation("[1] 'allows' mang nghĩa tạo điều kiện / cho phép. [2] 'developing a reading habit' là danh động từ số ít nên chia 'has been proven'.")
                .payloadJson(writeJson(q4_2Payload))
                .build();

        Map<String, Object> q4_3Payload = Map.of(
                "passage_title", "Artificial Intelligence in Everyday Life",
                "passage_text", "Artificial Intelligence (AI) is rapidly transforming how we live and work. From virtual assistants on smartphones to personalized recommendations on streaming services, AI algorithms analyze vast amounts of data to provide convenient solutions. However, experts remind us that ethical guidelines are essential to ensure user privacy and data security.",
                "sub_questions", List.of(
                        Map.of(
                                "id", "sub_1",
                                "question", "What is one application of AI mentioned in the passage?",
                                "options", List.of(
                                        "Spacecraft manual navigation",
                                        "Personalized recommendations on streaming services",
                                        "Traditional postal mail delivery",
                                        "Printing physical textbooks"
                                ),
                                "correct_answer", "Personalized recommendations on streaming services"
                        ),
                        Map.of(
                                "id", "sub_2",
                                "question", "Why do experts emphasize ethical guidelines for AI?",
                                "options", List.of(
                                        "To completely stop technological advancement",
                                        "To ensure user privacy and data security",
                                        "To increase the prices of smartphones",
                                        "To make algorithms run slower"
                                ),
                                "correct_answer", "To ensure user privacy and data security"
                        )
                )
        );
        GrammarQuestion q4_3 = GrammarQuestion.builder()
                .group(g4)
                .questionKey("cau_reading_1")
                .title("Câu 3: Đọc hiểu - Trí Tuệ Nhân Tạo (AI)")
                .questionType("READING_COMPREHENSION")
                .instruction("Đọc kỹ đoạn văn sau và trả lời các câu hỏi bên dưới:")
                .explanation("Đoạn văn nhấn mạnh ứng dụng thực tiễn của AI (gợi ý nội dung) và sự cần thiết của quy chuẩn đạo đức nhằm bảo vệ quyền riêng tư người dùng.")
                .payloadJson(writeJson(q4_3Payload))
                .build();

        Map<String, Object> q4_4Payload = Map.of(
                "audio_url", "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
                "transcript", "Good morning passengers! Flight VN382 to Da Nang is now boarding at Gate 4. Please have your boarding passes and identity cards ready.",
                "question_text", "Which flight is currently boarding according to the announcement?",
                "options", List.of(
                        "Flight VN382 to Da Nang at Gate 4",
                        "Flight VN120 to Hanoi at Gate 2",
                        "Flight QH555 to Nha Trang at Gate 10",
                        "Flight VJ888 to Phu Quoc at Gate 7"
                ),
                "correct_answer", "Flight VN382 to Da Nang at Gate 4"
        );
        GrammarQuestion q4_4 = GrammarQuestion.builder()
                .group(g4)
                .questionKey("cau_audio_1")
                .title("Câu 4: Nghe thông báo sân bay (Audio Listening)")
                .questionType("AUDIO_LISTENING")
                .instruction("Nghe thông báo âm thanh và chọn câu trả lời chính xác:")
                .explanation("Thông báo ghi rõ: 'Flight VN382 to Da Nang is now boarding at Gate 4'.")
                .payloadJson(writeJson(q4_4Payload))
                .build();

        questionRepository.saveAll(List.of(q4_1, q4_2, q4_3, q4_4));
        log.info("Default grammar test groups and questions successfully seeded.");
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> extractPayloadMap(GrammarQuestionDto dto) {
        Map<String, Object> payload = new HashMap<>();
        if (dto.getTokens() != null) payload.put("tokens", dto.getTokens());
        if (dto.getTemplate() != null) payload.put("template", dto.getTemplate());
        if (dto.getBlanks() != null) payload.put("blanks", dto.getBlanks());
        if (dto.getValidation() != null) payload.put("validation", dto.getValidation());
        if (dto.getImageUrl() != null) payload.put("image_url", dto.getImageUrl());
        if (dto.getImageCaption() != null) payload.put("image_caption", dto.getImageCaption());
        if (dto.getQuestionText() != null) payload.put("question_text", dto.getQuestionText());
        if (dto.getOptions() != null) payload.put("options", dto.getOptions());
        if (dto.getCorrectAnswer() != null) payload.put("correct_answer", dto.getCorrectAnswer());
        if (dto.getPassageTitle() != null) payload.put("passage_title", dto.getPassageTitle());
        if (dto.getPassageText() != null) payload.put("passage_text", dto.getPassageText());
        if (dto.getSubQuestions() != null) payload.put("sub_questions", dto.getSubQuestions());
        if (dto.getAudioUrl() != null) payload.put("audio_url", dto.getAudioUrl());
        if (dto.getTranscript() != null) payload.put("transcript", dto.getTranscript());
        return payload;
    }

    private GrammarGroupDto toGroupDto(GrammarGroup group) {
        List<GrammarQuestionDto> questionDtos = new ArrayList<>();
        if (group.getQuestions() != null) {
            for (GrammarQuestion q : group.getQuestions()) {
                questionDtos.add(toQuestionDto(q));
            }
        }

        List<GrammarReportDto> reportDtos = new ArrayList<>();
        if (group.getReports() != null) {
            for (GrammarQuestionReport r : group.getReports()) {
                reportDtos.add(toReportDto(r));
            }
        }

        return GrammarGroupDto.builder()
                .id(group.getGroupKey() != null ? group.getGroupKey() : group.getId().toString())
                .dbId(group.getId())
                .title(group.getTitle())
                .description(group.getDescription())
                .icon(group.getIcon())
                .author(AuthorDto.builder()
                        .name(group.getAuthorName())
                        .email(group.getAuthorEmail())
                        .build())
                .questions(questionDtos)
                .reports(reportDtos)
                .build();
    }

    private GrammarQuestionDto toQuestionDto(GrammarQuestion entity) {
        GrammarQuestionDto.GrammarQuestionDtoBuilder builder = GrammarQuestionDto.builder()
                .id(entity.getQuestionKey() != null ? entity.getQuestionKey() : entity.getId().toString())
                .dbId(entity.getId())
                .groupId(entity.getGroup() != null ? entity.getGroup().getGroupKey() : null)
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
                if (payload.containsKey("image_url")) builder.imageUrl((String) payload.get("image_url"));
                if (payload.containsKey("image_caption")) builder.imageCaption((String) payload.get("image_caption"));
                if (payload.containsKey("question_text")) builder.questionText((String) payload.get("question_text"));
                if (payload.containsKey("options")) builder.options(payload.get("options"));
                if (payload.containsKey("correct_answer")) builder.correctAnswer((String) payload.get("correct_answer"));
                if (payload.containsKey("passage_title")) builder.passageTitle((String) payload.get("passage_title"));
                if (payload.containsKey("passage_text")) builder.passageText((String) payload.get("passage_text"));
                if (payload.containsKey("sub_questions")) builder.subQuestions(payload.get("sub_questions"));
                if (payload.containsKey("audio_url")) builder.audioUrl((String) payload.get("audio_url"));
                if (payload.containsKey("transcript")) builder.transcript((String) payload.get("transcript"));
            } catch (Exception e) {
                log.warn("Failed to parse payloadJson for question {}: {}", entity.getId(), e.getMessage());
            }
        }

        return builder.build();
    }

    private GrammarQuestion toQuestionEntity(GrammarQuestionDto dto, GrammarGroup group) {
        String key = dto.getId() != null ? dto.getId().toString() : ("cau_" + System.currentTimeMillis());
        Map<String, Object> payload = extractPayloadMap(dto);

        return GrammarQuestion.builder()
                .group(group)
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

    private GrammarReportDto toReportDto(GrammarQuestionReport r) {
        String createdStr = r.getCreatedAt() != null
                ? r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null;

        return GrammarReportDto.builder()
                .id(r.getReportKey() != null ? r.getReportKey() : r.getId().toString())
                .dbId(r.getId())
                .groupId(r.getGroup() != null ? r.getGroup().getGroupKey() : null)
                .testId(r.getGroup() != null ? r.getGroup().getGroupKey() : null)
                .testTitle(r.getGroup() != null ? r.getGroup().getTitle() : null)
                .groupTitle(r.getGroup() != null ? r.getGroup().getTitle() : null)
                .questionId(r.getQuestionKey())
                .questionTitle(r.getQuestionTitle())
                .errorType(r.getErrorType())
                .description(r.getDescription())
                .reporterName(r.getReporterName())
                .reporterEmail(r.getReporterEmail())
                .authorName(r.getAuthorName())
                .authorEmail(r.getAuthorEmail())
                .status(r.getStatus())
                .createdAt(createdStr)
                .build();
    }
}
