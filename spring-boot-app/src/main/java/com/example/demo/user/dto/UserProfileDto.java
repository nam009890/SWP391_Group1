package com.example.demo.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private Long id;
    private String name;
    private String avatarUrl;
    private long followersCount;
    private long followingCount;
}
