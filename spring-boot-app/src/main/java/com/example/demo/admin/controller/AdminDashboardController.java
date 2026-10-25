package com.example.demo.admin.controller;
import com.example.demo.admin.service.AdminUserService;
import com.example.demo.admin.dto.AdminDtos.Dashboard;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/admin/dashboard") @RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminUserService service;
    @GetMapping public Dashboard dashboard() { return service.dashboard(); }
}
