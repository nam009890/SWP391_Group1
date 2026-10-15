package com.example.demo.common.security;

import com.example.demo.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class UserPrincipal implements UserDetails {
    private Long id;
    private String email;
    private String password;
    private String role;

    public UserPrincipal(Long id, String email, String password, String role) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public static UserPrincipal create(User user) {
        String password = user.getPassword();
        if (password == null || password.isEmpty()) {
            password = "OAUTH_USER_NO_PASSWORD";
        }
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                password,
                user.getRole()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role != null && !role.isBlank()) {
            return Collections.singletonList(new SimpleGrantedAuthority(role));
        }
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
