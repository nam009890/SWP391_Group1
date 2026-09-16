package com.example.demo.flashcard.service.impl;

import com.example.demo.flashcard.entity.Flashcard;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=";

    public List<Flashcard> generateFlashcards(String topic) throws Exception {
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

        // Build the request body for Gemini API
        Map<String, Object> requestBody = new HashMap<>();
        
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[]{part});
        
        requestBody.put("contents", new Object[]{content});

        // Removed generationConfig to maximize compatibility with all models

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        int maxRetries = 3;
        int attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Make the API call
                Map<String, Object> response = restTemplate.postForObject(GEMINI_API_URL + apiKey, entity, Map.class);

                // Extract the JSON text from response
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                Map<String, Object> firstCandidate = candidates.get(0);
                Map<String, Object> candidateContent = (Map<String, Object>) firstCandidate.get("content");
                List<Map<String, Object>> parts = (List<Map<String, Object>>) candidateContent.get("parts");
                String jsonText = (String) parts.get(0).get("text");

                // Extract only the JSON array part
                int startIndex = jsonText.indexOf('[');
                int endIndex = jsonText.lastIndexOf(']');
                if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
                    jsonText = jsonText.substring(startIndex, endIndex + 1);
                } else {
                    throw new Exception("AI không trả về định dạng mảng JSON hợp lệ.");
                }

                // Parse the JSON string into List<Flashcard>
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(jsonText, new TypeReference<List<Flashcard>>() {});
                
            } catch (org.springframework.web.client.HttpServerErrorException e) {
                // If it's a 503 or 500 error from Google, retry
                attempt++;
                if (attempt >= maxRetries) {
                    throw new Exception("Máy chủ AI của Google đang quá tải. Xin vui lòng thử lại sau.");
                }
                // Wait for 2 seconds before retrying
                Thread.sleep(2000);
            } catch (Exception e) {
                e.printStackTrace();
                throw new Exception("Lỗi xử lý phản hồi từ AI: " + e.getMessage());
            }
        }
        
        throw new Exception("Không thể kết nối đến AI sau nhiều lần thử.");
    }

    public String getAvailableModels() {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
        try {
            return restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            return "Lỗi khi lấy danh sách model: " + e.getMessage();
        }
    }
}
