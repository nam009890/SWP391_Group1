package com.example.demo.user.service;

import com.example.demo.user.dto.UserProfileDto;

import java.util.List;

public interface FollowService {
    void followUser(Long followerId, Long followingId);
    void unfollowUser(Long followerId, Long followingId);
    boolean isFollowing(Long followerId, Long followingId);
    List<UserProfileDto> getFollowers(Long userId);
    List<UserProfileDto> getFollowing(Long userId);
}
