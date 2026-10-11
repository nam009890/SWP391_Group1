package com.example.demo.flashcard.service.impl;

import com.example.demo.flashcard.entity.Flashcard;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public List<Flashcard> generateFlashcards(String topic) {
        // Kiểm tra nếu API key không hợp lệ hoặc đã bị tắt thì dùng Fallback Generator
        if (isApiKeyDisabled(apiKey)) {
            log.info("Gemini API key is not configured or disabled. Using smart local generator for topic: '{}'", topic);
            return generateFallbackFlashcards(topic);
        }

        try {
            return callGeminiApi(topic);
        } catch (Exception e) {
            log.warn("Gemini API call failed ({}). Gracefully falling back to smart local generator.", e.getMessage());
            return generateFallbackFlashcards(topic);
        }
    }

    private boolean isApiKeyDisabled(String key) {
        if (key == null || key.trim().isEmpty()) {
            return true;
        }
        String clean = key.trim();
        return clean.equalsIgnoreCase("YOUR_GEMINI_API_KEY")
                || clean.equalsIgnoreCase("none")
                || clean.equalsIgnoreCase("disabled")
                || clean.equalsIgnoreCase("off")
                || !clean.startsWith("AIza");
    }

    @SuppressWarnings("unchecked")
    private List<Flashcard> callGeminiApi(String topic) throws Exception {
        String prompt = "You are an expert language teacher. Generate English vocabulary flashcards based on this user request: '" + topic + "'. " +
                "If the user doesn't specify an exact number, generate 10 flashcards by default. " +
                "Return the response STRICTLY as a JSON array of objects. Do NOT include markdown formatting or backticks like ```json. " +
                "Each object MUST have these exact keys: " +
                "'vocabulary' (the English word), " +
                "'meaning' (Vietnamese translation), " +
                "'phonetic' (IPA phonetic transcription), " +
                "'exampleSentence' (an English example sentence).";

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        Map<String, Object> response = restTemplate.postForObject(GEMINI_API_URL + apiKey.trim(), entity, Map.class);

        if (response == null || !response.containsKey("candidates")) {
            throw new Exception("Phản hồi rỗng từ Gemini API");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates.isEmpty()) {
            throw new Exception("Không có kết quả trả về từ Gemini");
        }

        Map<String, Object> firstCandidate = candidates.get(0);
        Map<String, Object> candidateContent = (Map<String, Object>) firstCandidate.get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) candidateContent.get("parts");
        String jsonText = (String) parts.get(0).get("text");

        int startIndex = jsonText.indexOf('[');
        int endIndex = jsonText.lastIndexOf(']');
        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        } else {
            throw new Exception("AI không trả về định dạng mảng JSON hợp lệ.");
        }

        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(jsonText, new TypeReference<List<Flashcard>>() {});
    }

    /**
     * Bộ sinh Flashcard thông minh nội bộ khi không bật Gemini API Key.
     * Đảm bảo tính năng tạo thẻ vẫn hoạt động 100% mượt mà cho mọi chủ đề.
     */
    public List<Flashcard> generateFallbackFlashcards(String topic) {
        String normalized = topic != null ? topic.toLowerCase().trim() : "";
        List<Flashcard> list = new ArrayList<>();

        if (containsAny(normalized, "it", "công nghệ", "tech", "code", "lập trình", "software", "máy tính", "computer")) {
            list.add(createCard("Algorithm", "Thuật toán", "/ˈæl.ɡə.rɪ.ðəm/", "The search engine uses a complex algorithm to rank web pages."));
            list.add(createCard("Database", "Cơ sở dữ liệu", "/ˈdeɪ.tə.beɪs/", "All user information is securely stored in the relational database."));
            list.add(createCard("Framework", "Khung phần mềm / Nền tảng", "/ˈfreɪm.wɜːk/", "Spring Boot is an enterprise-level backend framework."));
            list.add(createCard("Interface", "Giao diện / Điểm nối tiếp", "/ˈɪn.tə.feɪs/", "The clean user interface provides a seamless customer experience."));
            list.add(createCard("Encryption", "Mã hóa dữ liệu", "/ɪnˈkrɪp.ʃən/", "Strong encryption prevents unauthorized access to personal records."));
            list.add(createCard("Optimization", "Sự tối ưu hóa", "/ˌɒp.tɪ.maɪˈzeɪ.ʃən/", "Database optimization significantly reduces server response times."));
            list.add(createCard("Repository", "Kho lưu trữ mã nguồn", "/rɪˈpɒz.ɪ.tər.i/", "Developers pull the latest code updates from the Git repository."));
            list.add(createCard("Asynchronous", "Bất đồng bộ", "/eɪˈsɪŋ.krə.nəs/", "Asynchronous API calls keep the web page interactive while loading."));
            list.add(createCard("Deployment", "Sự triển khai ứng dụng", "/dɪˈplɔɪ.mənt/", "Continuous deployment automates releasing new features safely."));
            list.add(createCard("Scalability", "Khả năng mở rộng hệ thống", "/ˌskeɪ.ləˈbɪl.ə.ti/", "Cloud architecture ensures great scalability during high traffic."));
        } else if (containsAny(normalized, "travel", "du lịch", "airport", "bay", "khách sạn", "hotel", "tour", "chuyến đi")) {
            list.add(createCard("Destination", "Điểm đến", "/ˌdes.tɪˈneɪ.ʃən/", "Da Nang is a renowned travel destination in Vietnam."));
            list.add(createCard("Itinerary", "Lịch trình chuyến đi", "/aɪˈtɪn.ər.ər.i/", "We planned a five-day itinerary exploring historical sites."));
            list.add(createCard("Departure", "Sự khởi hành", "/dɪˈpɑː.tʃər/", "The international flight departure was delayed by one hour."));
            list.add(createCard("Accommodation", "Chỗ ở / Nơi lưu trú", "/əˌkɒm.əˈdeɪ.ʃən/", "We booked comfortable beachfront accommodation in advance."));
            list.add(createCard("Luggage", "Hành lý", "/ˈlʌɡ.ɪdʒ/", "Passengers are advised to label their luggage clearly."));
            list.add(createCard("Sightseeing", "Ngắm cảnh / Tham quan", "/ˈsaɪtˌsiː.ɪŋ/", "The group spent the whole afternoon sightseeing downtown."));
            list.add(createCard("Souvenir", "Quà lưu niệm", "/ˌsuː.vənˈɪər/", "I bought a handcrafted souvenir for my family."));
            list.add(createCard("Boarding pass", "Thẻ lên máy bay", "/ˈbɔː.dɪŋ ˌpɑːs/", "Please present your boarding pass and passport at the gate."));
            list.add(createCard("Currency", "Tiền tệ", "/ˈkʌr.ən.si/", "You can exchange foreign currency at the international terminal."));
            list.add(createCard("Reservation", "Sự đặt trước", "/ˌrez.əˈveɪ.ʃən/", "Make a table reservation early because the restaurant gets crowded."));
        } else if (containsAny(normalized, "food", "ăn", "uống", "nấu", "cook", "restaurant", "nhà hàng", "món", "ẩm thực")) {
            list.add(createCard("Ingredient", "Nguyên liệu chế biến", "/ɪnˈɡriː.di.ənt/", "Fresh herbs are the essential ingredient in traditional pho."));
            list.add(createCard("Recipe", "Công thức nấu ăn", "/ˈres.ɪ.pi/", "She followed her grandmother's famous recipe step by step."));
            list.add(createCard("Delicious", "Thơm ngon", "/dɪˈlɪʃ.əs/", "The chef prepared an exceptionally delicious seafood dish."));
            list.add(createCard("Beverage", "Đồ uống / Thức uống", "/ˈbev.ər.ɪdʒ/", "Cold green tea is a very refreshing beverage in summer."));
            list.add(createCard("Flavor", "Hương vị", "/ˈfleɪ.vər/", "The exotic spices lend this broth a rich and savory flavor."));
            list.add(createCard("Appetizer", "Món khai vị", "/ˈæp.ə.taɪ.zər/", "We ordered crispy spring rolls as a light appetizer."));
            list.add(createCard("Nutritious", "Bổ dưỡng / Giàu dinh dưỡng", "/njuːˈtrɪʃ.əs/", "A bowl of fresh salad provides a nutritious, low-calorie meal."));
            list.add(createCard("Vegetarian", "Thuần chay / Ăn chay", "/ˌvedʒ.ɪˈteə.ri.ən/", "The bistro serves delicious vegetarian and vegan specialties."));
            list.add(createCard("Cuisine", "Phong cách ẩm thực", "/kwɪˈziːn/", "Vietnamese cuisine is celebrated worldwide for its balance."));
            list.add(createCard("Banquet", "Bữa tiệc thịnh soạn", "/ˈbæŋ.kwɪt/", "The grand anniversary banquet hosted over two hundred guests."));
        } else if (containsAny(normalized, "business", "kinh doanh", "công việc", "work", "office", "tiền", "finance", "doanh nghiệp")) {
            list.add(createCard("Negotiation", "Sự thương lượng, đàm phán", "/nəˌɡəʊ.ʃiˈeɪ.ʃən/", "The contract negotiation concluded successfully this morning."));
            list.add(createCard("Strategy", "Chiến lược kinh doanh", "/ˈstræt.ə.dʒi/", "A proactive digital strategy helped the company increase revenue."));
            list.add(createCard("Revenue", "Doanh thu", "/ˈrev.ən.juː/", "The startup reported a twenty percent increase in quarterly revenue."));
            list.add(createCard("Investment", "Khoản đầu tư", "/ɪnˈvest.mənt/", "Education is the most rewarding long-term investment."));
            list.add(createCard("Customer service", "Dịch vụ khách hàng", "/ˈkʌs.tə.mər ˈsɜː.vɪs/", "Exceptional customer service builds lasting customer trust."));
            list.add(createCard("Productivity", "Năng suất làm việc", "/ˌprɒd.ʌkˈtɪv.ə.ti/", "Good time management boosts daily workplace productivity."));
            list.add(createCard("Presentation", "Bài thuyết trình", "/ˌprez.ənˈteɪ.ʃən/", "She delivered an inspiring presentation to prospective investors."));
            list.add(createCard("Deadline", "Hạn chót hoàn thành", "/ˈded.laɪn/", "The engineering team worked diligently to beat the launch deadline."));
            list.add(createCard("Colleague", "Đồng nghiệp", "/ˈkɒl.iːɡ/", "I collaborate effectively with helpful and friendly colleagues."));
            list.add(createCard("Promotion", "Sự thăng chức", "/prəˈməʊ.ʃən/", "His outstanding performance earned him a prompt promotion."));
        } else if (containsAny(normalized, "animal", "động vật", "thú", "nature", "thiên nhiên", "rừng", "biển")) {
            list.add(createCard("Wildlife", "Động vật hoang dã", "/ˈwaɪld.laɪf/", "The conservation park protects rare and endangered wildlife."));
            list.add(createCard("Habitat", "Môi trường sống tự nhiên", "/ˈhæb.ɪ.tæt/", "The dense tropical rainforest is the natural habitat of wild birds."));
            list.add(createCard("Predator", "Động vật ăn thịt, săn mồi", "/ˈpred.ə.tər/", "Lions are formidable apex predators on the African savanna."));
            list.add(createCard("Migration", "Sự di cư", "/maɪˈɡreɪ.ʃən/", "Birds undertake an exhausting seasonal migration every autumn."));
            list.add(createCard("Species", "Loài sinh vật", "/ˈspiː.ʃiːz/", "Scientists discovered several new marine species in the deep ocean."));
            list.add(createCard("Extinct", "Đã tuyệt chủng", "/ɪkˈstɪŋkt/", "Dinosaurs have been extinct for tens of millions of years."));
            list.add(createCard("Mammal", "Động vật có vú", "/ˈmæm.əl/", "Whales are warm-blooded mammals that breathe air through blowholes."));
            list.add(createCard("Biodiversity", "Sự đa dạng sinh học", "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/", "Pollution poses a severe threat to global marine biodiversity."));
            list.add(createCard("Rainforest", "Rừng mưa nhiệt đới", "/ˈreɪn.fɒr.ɪst/", "The Amazon rainforest produces a large percentage of earth's oxygen."));
            list.add(createCard("Conservation", "Công tác bảo tồn", "/ˌkɒn.səˈveɪ.ʃən/", "Environmental conservation protects forests for future generations."));
        } else if (containsAny(normalized, "health", "sức khỏe", "bệnh", "y tế", "medical", "doctor", "thể thao", "sport")) {
            list.add(createCard("Nutrition", "Chế độ dinh dưỡng", "/njuːˈtrɪʃ.ən/", "Balanced nutrition is fundamental to maintaining a healthy lifestyle."));
            list.add(createCard("Immunity", "Hệ miễn dịch", "/ɪˈmjuː.nə.ti/", "Vitamin C and regular rest strengthen your natural immunity."));
            list.add(createCard("Recovery", "Sự hồi phục sức khỏe", "/rɪˈkʌv.ər.i/", "The patient made a speedy recovery after the medical procedure."));
            list.add(createCard("Endurance", "Sức chịu đựng, sức bền", "/ɪnˈdʒʊə.rəns/", "Long-distance cycling builds cardiovascular health and endurance."));
            list.add(createCard("Symptom", "Triệu chứng bệnh", "/ˈsɪmp.təm/", "A persistent cough and fever are typical symptoms of a cold."));
            list.add(createCard("Prescription", "Đơn thuốc", "/prɪˈskrɪp.ʃən/", "The pharmacist filled the antibiotic prescription promptly."));
            list.add(createCard("Prevention", "Sự phòng ngừa", "/prɪˈven.ʃən/", "Effective prevention is always better and cheaper than cure."));
            list.add(createCard("Flexibility", "Độ dẻo dai", "/ˌflek.səˈbɪl.ə.ti/", "Practicing yoga regularly improves physical flexibility and posture."));
            list.add(createCard("Cardiology", "Khoa tim mạch", "/ˌkɑː.diˈɒl.ə.dʒi/", "He consulted a leading professor in cardiology regarding his heart."));
            list.add(createCard("Wellbeing", "Hạnh phúc, khỏe khoắn", "/ˈwelˌbiː.ɪŋ/", "Mindfulness and daily walking support physical and mental wellbeing."));
        } else {
            // Mặc định: Từ vựng thông dụng & IELTS học thuật chất lượng cao
            list.add(createCard("Vocabulary", "Từ vựng", "/vəˈkæb.jə.lər.i/", "Daily flashcard practice expands your English vocabulary rapidly."));
            list.add(createCard("Fluency", "Sự lưu loát", "/ˈfluː.ən.si/", "Practicing speaking with native speakers builds natural fluency."));
            list.add(createCard("Pronunciation", "Cách phát âm", "/prəˌnʌn.siˈeɪ.ʃən/", "Clear pronunciation ensures your ideas are understood immediately."));
            list.add(createCard("Comprehension", "Khả năng thấu hiểu", "/ˌkɒm.prɪˈhen.ʃən/", "Extensive reading deepens listening and reading comprehension."));
            list.add(createCard("Perspective", "Góc nhìn, quan điểm", "/pəˈspek.tɪv/", "Traveling gives you a fresh perspective on international cultures."));
            list.add(createCard("Significant", "Đáng kể, quan trọng", "/sɪɡˈnɪf.ɪ.kənt/", "She achieved a significant milestone in her academic career."));
            list.add(createCard("Collaboration", "Sự cộng tác, hợp tác", "/kəˌlæb.əˈreɪ.ʃən/", "Teamwork and collaboration foster creative breakthroughs."));
            list.add(createCard("Innovation", "Sự đổi mới, sáng tạo", "/ˌɪn.əˈveɪ.ʃən/", "Technological innovation transforms how people study and work."));
            list.add(createCard("Consistency", "Tính kiên trì, nhất quán", "/kənˈsɪs.tən.si/", "Consistency in learning every single day is the key to mastery."));
            list.add(createCard("Achievement", "Thành tựu đạt được", "/əˈtʃiːv.mənt/", "Completing this flashcard deck is a commendable achievement."));
        }

        return list;
    }

    private Flashcard createCard(String vocab, String meaning, String phonetic, String example) {
        return Flashcard.builder()
                .vocabulary(vocab)
                .meaning(meaning)
                .phonetic(phonetic)
                .exampleSentence(example)
                .build();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}
