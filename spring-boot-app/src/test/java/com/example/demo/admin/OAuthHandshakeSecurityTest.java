package com.example.demo.admin;

import com.example.demo.common.security.HttpCookieOAuth2AuthorizationRequestRepository;
import com.example.demo.demo.DemoDataInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.*;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class OAuthHandshakeSecurityTest {
    @Test void browserCookieCannotInjectSerializedAuthorizationRequestAndStateMustMatch() {
        var repository=new HttpCookieOAuth2AuthorizationRequestRepository();
        var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
        request.setCookies(new Cookie("oauth2_auth_request","untrusted-serialized-object"));
        assertNull(repository.loadAuthorizationRequest(request));
        var authorization=OAuth2AuthorizationRequest.authorizationCode().authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client").redirectUri("http://localhost:8080/login/oauth2/code/google").state("expected-state").build();
        repository.saveAuthorizationRequest(authorization,request,response);
        request.setParameter("state","wrong-state");assertNull(repository.loadAuthorizationRequest(request));
        request.setParameter("state","expected-state");assertNotNull(repository.loadAuthorizationRequest(request));
        repository.removeAuthorizationRequestCookies(request,response);assertNull(request.getSession(false));
    }
    @Test void productionProfilesCannotCreateTheDemoInitializerEvenWhenOptedIn() {
        for(String production:new String[]{"prod","production"}){
            try(var context=new AnnotationConfigApplicationContext()){
                context.getEnvironment().setActiveProfiles("demo",production);
                context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test",Map.of("app.demo.seed-enabled","true")));
                context.register(DemoDataInitializer.class);context.refresh();
                assertTrue(context.getBeansOfType(DemoDataInitializer.class).isEmpty());
            }
        }
    }
}
