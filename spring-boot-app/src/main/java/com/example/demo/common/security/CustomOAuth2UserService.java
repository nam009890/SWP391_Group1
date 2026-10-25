package com.example.demo.common.security;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository users;
    private final jakarta.persistence.EntityManager entityManager;
    @Override @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User identity = super.loadUser(request);
        linkVerifiedIdentity(identity);
        return identity;
    }
    @Transactional
    public User linkVerifiedIdentity(OAuth2User identity) {
        String email = identity.getAttribute("email");
        String sub = identity.getAttribute("sub");
        if (!Boolean.TRUE.equals(identity.getAttribute("email_verified")) || email == null || sub == null) {
            throw failure("OAUTH_FAILED");
        }
        if (email.isBlank() || sub.isBlank()) throw failure("OAUTH_FAILED");
        User u = users.findByProviderAndProviderId("GOOGLE",sub).orElseGet(()->users.findByEmail(email).orElse(null));
        if (u == null) {
            u = User.builder().email(email).provider("GOOGLE").providerId(sub).role("ROLE_USER")
                    .name(identity.getAttribute("name")).avatarUrl(identity.getAttribute("picture")).build();
        } else {
            u = users.findForUpdate(u.getId()).orElseThrow();
            entityManager.refresh(u, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
            if (u.isLocked()) throw failure("ACCOUNT_LOCKED");
            if (u.getProviderId() != null && !sub.equals(u.getProviderId())) throw failure("OAUTH_FAILED");
            // LOCAL phải được liên kết bằng luồng xác thực riêng; không tự gộp theo email.
            if (!"GOOGLE".equals(u.getProvider())) throw failure("OAUTH_LINK_REQUIRED");
            if (!email.equalsIgnoreCase(u.getEmail())) throw failure("OAUTH_FAILED");
            u.setProviderId(sub);
        }
        return users.save(u);
    }
    private OAuth2AuthenticationException failure(String code) {
        return new OAuth2AuthenticationException(new OAuth2Error(code));
    }
}
