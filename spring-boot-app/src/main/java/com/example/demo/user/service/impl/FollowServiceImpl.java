package com.example.demo.user.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.user.dto.UserProfileDto;
import com.example.demo.user.entity.Follow;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.FollowRepository;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }
        
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            return; // Already following
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("User to follow not found"));

        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();
        
        followRepository.save(follow);
    }

    @Override
    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        followRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .ifPresent(followRepository::delete);
    }

    @Override
    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    @Override
    public List<UserProfileDto> getFollowers(Long userId) {
        return followRepository.findByFollowingId(userId).stream()
                .map(Follow::getFollower)
                .map(this::mapToProfileDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserProfileDto> getFollowing(Long userId) {
        return followRepository.findByFollowerId(userId).stream()
                .map(Follow::getFollowing)
                .map(this::mapToProfileDto)
                .collect(Collectors.toList());
    }

    private UserProfileDto mapToProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .followersCount(followRepository.countByFollowingId(user.getId()))
                .followingCount(followRepository.countByFollowerId(user.getId()))
                .build();
    }
}
