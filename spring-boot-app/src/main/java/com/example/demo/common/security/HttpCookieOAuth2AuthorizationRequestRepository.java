package com.example.demo.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.stereotype.Component;

/** Chỉ handshake OAuth dùng session server; không deserialize dữ liệu Java từ cookie người dùng. */
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository implements org.springframework.security.oauth2.client.web.AuthorizationRequestRepository<org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest> {
    private final HttpSessionOAuth2AuthorizationRequestRepository delegate=new HttpSessionOAuth2AuthorizationRequestRepository();
    @Override public org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) { return delegate.loadAuthorizationRequest(request); }
    @Override public void saveAuthorizationRequest(org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest value,HttpServletRequest request,HttpServletResponse response) { delegate.saveAuthorizationRequest(value,request,response); }
    @Override public org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,HttpServletResponse response) { return delegate.removeAuthorizationRequest(request,response); }
    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        var session=request.getSession(false);
        if(session!=null)session.invalidate();
        CookieUtils.deleteCookie(request,response,"oauth2_auth_request");
        CookieUtils.deleteCookie(request,response,"redirect_uri");
    }
}
