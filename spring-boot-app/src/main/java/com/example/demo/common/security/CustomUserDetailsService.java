package com.example.demo.common.security;

import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Use Spring Security's built-in User object for UserDetails
        String password = user.getPassword();
        if (password == null || password.isEmpty()) {
            password = "OAUTH_USER_NO_PASSWORD";
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                new ArrayList<>() // Empty authorities for now
        );
    }
}
