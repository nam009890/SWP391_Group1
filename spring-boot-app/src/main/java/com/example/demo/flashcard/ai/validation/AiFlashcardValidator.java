package com.example.demo.flashcard.ai.validation;

import com.example.demo.flashcard.ai.dto.AiDtos.*;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AiFlashcardValidator {
    public String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFKC).replace('’', '\'')
                .replace('‐', '-').replace('‑', '-').replaceAll("[\\s\\p{Z}]+", " ").trim().toLowerCase(Locale.ROOT);
    }

    public Spec specification(PreviewRequest request, int maxCards) {
        String topic = clean(request.topic());
        String level = request.level() == null ? "B1" : request.level().trim().toUpperCase(Locale.ROOT);
        String type = request.type() == null ? "MIXED" : request.type().trim().toUpperCase(Locale.ROOT);
        int count = request.count() == null ? 10 : request.count();
        String context = clean(request.context());
        if (topic.isEmpty() || topic.length() > 300 || unsafe(topic) || context.length() > 300 || unsafe(context)
                || !Set.of("A1","A2","B1","B2","C1","C2").contains(level)
                || !Set.of("WORD","PHRASE","MIXED").contains(type)
                || !Set.of(5,10,15,20).contains(count) || count > Math.min(20, maxCards)) {
            throw new IllegalArgumentException("Chủ đề/context tối đa 300 ký tự; chọn CEFR, loại từ và số lượng hợp lệ trong giới hạn hệ thống");
        }
        return new Spec(topic, level, count, type, context);
    }

    public Card card(Card input) {
        if (input == null) throw new IllegalArgumentException("Thẻ không hợp lệ");
        String word = clean(input.vocabulary());
        String meaning = clean(input.meaning());
        String example = clean(input.exampleSentence());
        String ipa = clean(input.phonetic());
        if (word.isEmpty() || word.length() > 255 || !word.matches("[A-Za-z]+(?:[ '-][A-Za-z]+)*")
                || meaning.isEmpty() || meaning.length() > 255 || example.isEmpty() || example.length() > 1000
                || unsafe(meaning) || unsafe(example)) {
            throw new IllegalArgumentException("Thẻ cần từ tiếng Anh, nghĩa tiếng Việt và ví dụ hợp lệ trong giới hạn độ dài");
        }
        // Kiểm tra bảo thủ: nghĩa có dấu tiếng Việt hoặc từ mượn thông dụng. Không thay thế thẩm định ngôn ngữ.
        if (!Pattern.compile("[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(meaning).find() && !Set.of("email","internet","video","robot","marketing","taxi","wifi","doanh thu").contains(meaning.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Nghĩa cần viết bằng tiếng Việt");
        }
        String normalizedExample = normalize(example);
        if (!Pattern.compile("(?<![a-z])" + Pattern.quote(normalize(word)) + "(?![a-z])")
                .matcher(normalizedExample).find()) {
            throw new IllegalArgumentException("Câu ví dụ phải chứa đúng từ hoặc cụm từ được học");
        }
        // IPA không chắc chắn được bỏ trống, không tự bịa phiên âm.
        if (!ipa.isEmpty() && (ipa.length() > 255 || unsafe(ipa)
                || !ipa.matches("[/\\[][\\p{L}\\p{M}ˈˌːˑ .()'-]+[/\\]]"))) {
            ipa = "";
        }
        return new Card(word, meaning, ipa.isEmpty() ? null : ipa, example);
    }

    public void type(Card card, String type) {
        boolean phrase = card.vocabulary().contains(" ");
        if (("WORD".equals(type) && phrase) || ("PHRASE".equals(type) && !phrase)) {
            throw new IllegalArgumentException("Thẻ không khớp loại từ đã chọn");
        }
    }

    private String clean(String value) {
        return value == null ? "" : Normalizer.normalize(value, Normalizer.Form.NFC).trim().replaceAll("[\\s\\p{Z}]+", " ");
    }
    private boolean unsafe(String value) {
        return value.contains("<") || value.contains(">") || value.chars().anyMatch(c -> Character.isISOControl(c));
    }
}
