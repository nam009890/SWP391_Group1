package com.example.demo.common.security;
import com.example.demo.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.*;
@Getter @AllArgsConstructor
public class UserPrincipal implements UserDetails {
    private Long id;
    private String email;
    private String password;
    private String role;
    private boolean locked;
    private long tokenVersion;
    private String authIdentity;
    public static UserPrincipal create(User u) {
        return new UserPrincipal(u.getId(),u.getEmail(),u.getPassword() == null ? "" : u.getPassword(),
                "ROLE_ADMIN".equals(u.getRole()) ? "ROLE_ADMIN" : "ROLE_USER",u.isLocked(),u.getTokenVersion(),u.getAuthIdentity());
    }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority(role)); }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return !locked; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
