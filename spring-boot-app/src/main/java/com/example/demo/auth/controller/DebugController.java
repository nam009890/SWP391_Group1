package com.example.demo.auth.controller;

import com.example.demo.common.security.JwtTokenProvider;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class DebugController {

    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/debug-token")
    public String getDebugToken() {
        return tokenProvider.generateToken("namnguyendev2k@gmail.com");
    }
    
    @GetMapping("/fix-user")
    public String fixUser() {
        String email = "namnguyendev2k@gmail.com";
        User user = userRepository.findByEmail(email).orElse(null);
        if(user == null) {
            user = new User();
            user.setEmail(email);
            user.setProvider("GOOGLE");
            user.setRole("ROLE_USER");
            user.setName("Nam Nguyen");
            userRepository.save(user);
            return "User created!";
        }
        return "User already exists!";
    }
}
