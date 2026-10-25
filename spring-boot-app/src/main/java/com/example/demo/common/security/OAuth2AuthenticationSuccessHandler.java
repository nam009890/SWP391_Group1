package com.example.demo.common.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontend;

    public String frontendUrl() {
        var uri=java.net.URI.create(frontend);
        if(!java.util.Set.of("http","https").contains(uri.getScheme()) || uri.getHost()==null || uri.getRawQuery()!=null || uri.getRawFragment()!=null)
            throw new IllegalStateException("Invalid frontend origin configuration");
        return frontend.replaceAll("/+$", "");
    }
    @Autowired
    private OAuthAccountService accounts;

    @Autowired
    private HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        
        String token;
        try {
            token = accounts.complete(email);
        } catch (org.springframework.security.authentication.LockedException e) {
            clearAuthenticationAttributes(request, response);
            getRedirectStrategy().sendRedirect(request, response, frontendUrl()+"/login?error=ACCOUNT_LOCKED");
            return;
        }
        
        clearAuthenticationAttributes(request, response);
        
        // Redirect to React Frontend with token in query param
        String frontendUrl = frontendUrl()+"/oauth2/redirect";
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "#token=" + token);
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}
