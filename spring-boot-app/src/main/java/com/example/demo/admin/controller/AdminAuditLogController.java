package com.example.demo.admin.controller;
import com.example.demo.admin.service.AdminAuditLogService;
import com.example.demo.admin.dto.AdminDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/admin/audit-logs") @RequiredArgsConstructor
public class AdminAuditLogController {
    private final AdminAuditLogService service;
    @GetMapping public Paged<Audit> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size,
            @RequestParam(required=false) Long targetUserId,@RequestParam(required=false) Long adminId,
            @RequestParam(defaultValue="ALL") String action) {
        return service.list(page,size,targetUserId,adminId,action);
    }
}
