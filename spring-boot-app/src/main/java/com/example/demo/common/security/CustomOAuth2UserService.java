package com.example.demo.common.security;

import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");
        String avatarUrl = oAuth2User.getAttribute("picture");

        User user = userRepository.findByEmail(email).orElse(null);
        if(user == null) {
            user = new User();
            user.setEmail(email);
            user.setProvider("GOOGLE");
            user.setRole("ROLE_USER");
        }
        user.setName(name);
        user.setProviderId(providerId);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return oAuth2User;
    }
}
