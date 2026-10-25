package com.example.demo.flashcard.ai.exception;

import com.example.demo.common.exception.BusinessException;

@lombok.Getter
public class AiException extends BusinessException {
    private Long inputTokens;
    private Long outputTokens;
    private Integer providerAttempts;

    public AiException usage(Long input, Long output, int attempts) {
        inputTokens = input;
        outputTokens = output;
        providerAttempts = attempts;
        return this;
    }
    public AiException(int status, String code) {
        super(status, code, message(code));
    }

    private static String message(String code) {
        return switch (code) {
            case "GEMINI_AUTH_ERROR" -> "Gemini từ chối API key hoặc quyền truy cập. Người vận hành cần kiểm tra cấu hình backend.";
            case "AI_TIMEOUT" -> "Dịch vụ AI hết thời gian chờ. Chưa lưu thẻ; không tự gửi lại yêu cầu có thể bị tính phí.";
            case "OPENAI_INSUFFICIENT_QUOTA", "GEMINI_INSUFFICIENT_QUOTA" -> "Đã hết hạn mức API của provider. Kiểm tra quota/thanh toán; có thể chủ động dùng thư viện offline cho Travel hoặc Business English (B1).";
            case "OPENAI_RATE_LIMIT", "GEMINI_RATE_LIMIT" -> "Provider đang giới hạn tốc độ yêu cầu. Thử lại sau hoặc chủ động dùng thư viện offline cho Travel/Business English (B1).";
            case "APPLICATION_DAILY_LIMIT" -> "Bạn đã đạt hạn mức tạo thẻ trong ngày của EVMS.";
            case "APPLICATION_GLOBAL_LIMIT" -> "EVMS đã đạt hạn mức tạo thẻ toàn hệ thống trong ngày.";
            case "APPLICATION_CONCURRENT_LIMIT" -> "Bạn đang có một yêu cầu tạo thẻ khác được xử lý.";
            case "AI_NOT_CONFIGURED" -> "Chức năng chưa được cấu hình hoặc đang tắt. Kiểm tra provider, model và API key ở backend.";
            case "AI_PROVIDER_UNAVAILABLE" -> "Dịch vụ AI tạm thời không khả dụng hoặc hết thời gian chờ. Không có thẻ nào được lưu.";
            case "AI_RATE_LIMITED" -> "Dịch vụ AI đang giới hạn yêu cầu. Vui lòng thử lại sau.";
            case "AI_QUOTA_EXCEEDED" -> "Hạn mức API đã hết. Người vận hành cần kiểm tra thanh toán API.";
            case "AI_INVALID_RESPONSE" -> "AI trả về nội dung không đúng định dạng yêu cầu. Không có thẻ nào được lưu.";
            case "GENERATION_LIMIT_REACHED" -> "Đã đạt giới hạn tạo thẻ trong ngày hoặc đang có yêu cầu khác được xử lý.";
            case "NO_VALID_CARDS" -> "Không còn thẻ hợp lệ, mới và phù hợp để xem trước. Hãy đổi chủ đề hoặc kiểm tra Deck.";
            case "GENERATION_EXPIRED" -> "Bản xem trước đã hết hạn. Vui lòng tạo bản mới.";
            case "GENERATION_ALREADY_COMMITTED" -> "Bản xem trước đã được lưu với lựa chọn khác.";
            case "GENERATION_REQUEST_CONFLICT" -> "requestId đã được sử dụng cho yêu cầu khác.";
            case "GENERATION_IN_PROGRESS" -> "Yêu cầu này đang được xử lý. Thử lấy lại bằng cùng requestId sau ít giây.";
            case "DEMO_TOPIC_UNSUPPORTED" -> "Thư viện demo chỉ hỗ trợ Travel hoặc Business English, mức B1. Không tự thay bằng chủ đề khác.";
            case "DUPLICATE_FLASHCARD" -> "Có từ trùng trong lựa chọn hoặc Deck. Hãy sửa hoặc bỏ chọn từ trùng rồi lưu lại.";
            default -> "Không hoàn tất được yêu cầu tạo thẻ. Không có thẻ nào được lưu.";
        };
    }
}
