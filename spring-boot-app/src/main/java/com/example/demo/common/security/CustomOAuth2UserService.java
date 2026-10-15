package com.example.demo.common.security;

import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.service.WeakVocabularyService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final WeakVocabularyService weakVocabularyService;

    public CustomOAuth2UserService(UserRepository userRepository, WeakVocabularyService weakVocabularyService) {
        super();
        this.userRepository = userRepository;
        this.weakVocabularyService = weakVocabularyService;
    }

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
            // Gán quyền ADMIN cho tài khoản Google của tác giả buiquangviet032@gmail.com
            user.setRole("buiquangviet032@gmail.com".equalsIgnoreCase(email) ? "ROLE_ADMIN" : "ROLE_USER");
        } else if ("buiquangviet032@gmail.com".equalsIgnoreCase(email)) {
            // Đảm bảo tài khoản buiquangviet032@gmail.com luôn có quyền ROLE_ADMIN
            user.setRole("ROLE_ADMIN");
        }
        user.setName(name);
        user.setProviderId(providerId);
        user.setAvatarUrl(avatarUrl);
        User savedUser = userRepository.save(user);

        // Khởi tạo dữ liệu mẫu từ vựng yếu cho tài khoản Google mới đăng nhập
        weakVocabularyService.initializeStarterDataForUser(savedUser.getId());

        return oAuth2User;
    }
}
