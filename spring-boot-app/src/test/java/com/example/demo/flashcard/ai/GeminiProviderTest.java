package com.example.demo.flashcard.ai;

import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.flashcard.ai.provider.GeminiFlashcardGenerationProvider;
import com.example.demo.flashcard.ai.service.AiPromptBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import java.util.*;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@ExtendWith(OutputCaptureExtension.class)
class GeminiProviderTest {
    ObjectMapper json=new ObjectMapper();
    AiProperties settings=new AiProperties();
    AiPromptBuilder prompt=new AiPromptBuilder(json);
    Spec spec=new Spec("Travel","B1",5,"MIXED","School");
    MockRestServiceServer server;
    GeminiFlashcardGenerationProvider provider;
    String url="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
    String cards="{\"cards\":[{\"vocabulary\":\"passport\",\"meaning\":\"hộ chiếu\",\"phonetic\":null,\"exampleSentence\":\"Keep your passport safe.\"}]}";
    @BeforeEach void setup() {
        var builder=RestClient.builder();server=MockRestServiceServer.bindTo(builder).build();
        settings.getGemini().setApiKey("test-secret-not-real");settings.getGemini().setModel("gemini-3.8-flash");
        provider=new GeminiFlashcardGenerationProvider(builder.build(),settings,prompt,json);
    }
    String envelope(String content,String finish) throws Exception {
        return json.writeValueAsString(Map.of("candidates",List.of(Map.of("finishReason",finish,"content",Map.of("parts",List.of(Map.of("text",content))))),
                "usageMetadata",Map.of("promptTokenCount",100,"candidatesTokenCount",50,"thoughtsTokenCount",10)));
    }
    @Test void requestUsesHeaderStructuredSchemaAndActualUsage() throws Exception {
        server.expect(requestTo(url)).andExpect(method(HttpMethod.POST)).andExpect(header("x-goog-api-key","test-secret-not-real"))
                .andExpect(jsonPath("$.generationConfig.responseFormat.text.mimeType").value("APPLICATION_JSON"))
                .andExpect(jsonPath("$.generationConfig.responseFormat.text.schema.additionalProperties").value(false))
                .andExpect(jsonPath("$.generationConfig.maxOutputTokens").value(6000))
                .andRespond(withSuccess(envelope(cards,"STOP"),MediaType.APPLICATION_JSON));
        var result=provider.generate(spec,List.of("hotel"));
        assertEquals("GEMINI",provider.source());assertEquals(100L,result.inputTokens());assertEquals(60L,result.outputTokens());
        assertEquals(1,result.attempts());assertEquals("passport",result.cards().get(0).vocabulary());server.verify();
    }
    @Test void promptsHaveEquivalentPedagogicalInputAndSchema() throws Exception {
        var gemini=json.valueToTree(prompt.geminiRequest(6000,spec,List.of("hotel")));
        var openai=json.valueToTree(prompt.request("configured-model",6000,spec,List.of("hotel")));
        assertEquals(openai.path("input").get(0).path("content").asText(),gemini.path("systemInstruction").path("parts").get(0).path("text").asText());
        assertEquals(json.readTree(openai.path("input").get(1).path("content").asText()),json.readTree(gemini.path("contents").get(0).path("parts").get(0).path("text").asText()));
        assertEquals(openai.path("text").path("format").path("schema"),gemini.path("generationConfig").path("responseFormat").path("text").path("schema"));
    }
    @ParameterizedTest @ValueSource(ints={401,403}) void invalidKeyDoesNotRetry(int status) {
        server.expect(requestTo(url)).andRespond(withStatus(HttpStatus.valueOf(status)));
        assertEquals("GEMINI_AUTH_ERROR",assertThrows(AiException.class,()->provider.generate(spec,List.of())).getCode());server.verify();
    }
    @Test void invalidKeyInGoogleBadRequestDetailsIsAuthenticationError() {
        server.expect(requestTo(url)).andRespond(withBadRequest().body("{\"error\":{\"details\":[{\"reason\":\"API_KEY_INVALID\"}]}}"));
        var e=assertThrows(AiException.class,()->provider.generate(spec,List.of()));assertEquals("GEMINI_AUTH_ERROR",e.getCode());assertEquals(503,e.getStatus());server.verify();
    }
    @Test void minuteRateLimitRetriesOnce() {
        for(int i=0;i<2;i++)server.expect(requestTo(url)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After","0").body("{\"error\":{\"status\":\"RESOURCE_EXHAUSTED\"}}"));
        var e=assertThrows(AiException.class,()->provider.generate(spec,List.of()));assertEquals("GEMINI_RATE_LIMIT",e.getCode());assertEquals(2,e.getProviderAttempts());server.verify();
    }
    @Test void dailyQuotaDoesNotRetry() {
        server.expect(requestTo(url)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).body("{\"error\":{\"details\":[{\"violations\":[{\"quotaId\":\"GenerateRequestsPerDayPerProject\"}]}]}}"));
        assertEquals("GEMINI_INSUFFICIENT_QUOTA",assertThrows(AiException.class,()->provider.generate(spec,List.of())).getCode());server.verify();
    }
    @Test void longRetryDelayDoesNotBlockOrRetry() {
        server.expect(requestTo(url)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).body("{\"error\":{\"details\":[{\"retryDelay\":\"40s\"}]}}"));
        assertEquals("GEMINI_RATE_LIMIT",assertThrows(AiException.class,()->provider.generate(spec,List.of())).getCode());server.verify();
    }
    @Test void timeoutNeverRetriesOrChangesProvider() {
        server.expect(requestTo(url)).andRespond(withException(new java.net.SocketTimeoutException("test-secret-not-real")));
        var error=assertThrows(AiException.class,()->provider.generate(spec,List.of()));assertEquals("AI_TIMEOUT",error.getCode());assertFalse(error.getMessage().contains("test-secret-not-real"));server.verify();
    }
    @Test void transientServerFailureCanRecover() throws Exception {
        server.expect(requestTo(url)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).header("Retry-After","0"));
        server.expect(requestTo(url)).andRespond(withSuccess(envelope(cards,"STOP"),MediaType.APPLICATION_JSON));
        assertEquals(2,provider.generate(spec,List.of()).attempts());server.verify();
    }
    @ParameterizedTest @ValueSource(strings={"not json","null","{\"cards\":[]} trailing","{\"cards\":[{}]}","{\"cards\":[],\"unexpected\":1}"})
    void malformedJsonRejected(String content) throws Exception {
        var bytes=envelope(content,"STOP").getBytes(StandardCharsets.UTF_8);
        var error=assertThrows(AiException.class,()->provider.parse(bytes,1));assertEquals("AI_INVALID_RESPONSE",error.getCode());assertEquals(100L,error.getInputTokens());
    }
    @ParameterizedTest @ValueSource(strings={"MAX_TOKENS","SAFETY","RECITATION"}) void incompleteOrBlockedCandidateRejected(String finish) throws Exception {
        byte[] bytes=envelope(cards,finish).getBytes(StandardCharsets.UTF_8);
        assertEquals("AI_INVALID_RESPONSE",assertThrows(AiException.class,()->provider.parse(bytes,1)).getCode());
    }
    @Test void missingConfigurationDoesNotSendRequest() {
        settings.getGemini().setApiKey("");assertEquals("AI_NOT_CONFIGURED",assertThrows(AiException.class,()->provider.generate(spec,List.of())).getCode());server.verify();
    }
    @Test void diagnosticLogNeverIncludesProviderBodyOrCredential(CapturedOutput output) {
        server.expect(requestTo(url)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After","10")
                .body("{\"error\":{\"message\":\"test-secret-not-real private prompt\"}}"));
        assertThrows(AiException.class,()->provider.generate(spec,List.of()));
        assertTrue(output.getOut().contains("diagnostic=GEMINI_RATE_LIMIT"));
        assertFalse(output.getAll().contains("test-secret-not-real"));
        assertFalse(output.getAll().contains("private prompt"));server.verify();
    }
    @Test void repeatedJsonPropertyIsRejected() throws Exception {
        byte[] bytes=envelope("{\"cards\":[],\"cards\":[]}","STOP").getBytes(StandardCharsets.UTF_8);
        assertEquals("AI_INVALID_RESPONSE",assertThrows(AiException.class,()->provider.parse(bytes,1)).getCode());
    }
    @Test void legacyOpenAiConfigurationStillWorksAndNestedOverrides() {
        settings.setApiKey("old-key");settings.setModel("old-model");assertEquals("old-key",settings.openAiKey());
        settings.getOpenai().setApiKey("new-key");settings.getOpenai().setModel("new-model");
        assertEquals("new-key",settings.openAiKey());assertEquals("new-model",settings.openAiModel());
        settings.setProvider("gemini");assertEquals("GEMINI",settings.source());settings.setEnabled(false);assertEquals("DISABLED",settings.source());
    }
}
