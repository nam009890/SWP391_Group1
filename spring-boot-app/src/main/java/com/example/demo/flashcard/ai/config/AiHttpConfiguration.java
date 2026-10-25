package com.example.demo.flashcard.ai.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.context.annotation.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AiHttpConfiguration {
    @Bean({"openAiRestClient", "geminiRestClient"})
    @Lazy
    public RestClient client(AiProperties settings) {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(Math.min(10, settings.timeout())))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(settings.timeout()));
        return RestClient.builder().requestFactory(factory).build();
    }
}
