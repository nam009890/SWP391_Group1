package com.example.demo.admin.controller;
import com.example.demo.admin.service.AdminUserService;
import com.example.demo.admin.dto.AdminDtos.*;
import com.example.demo.common.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/admin/users") @RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService service;
    @GetMapping public Paged<UserItem> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size,
            @RequestParam(defaultValue="") String keyword,@RequestParam(defaultValue="ALL") String role,
            @RequestParam(defaultValue="ALL") String status,@RequestParam(defaultValue="NEWEST") String sort) {
        return service.list(page,size,keyword,role,status,sort);
    }
    @GetMapping("/{id}") public UserDetails details(@PathVariable Long id) { return service.details(id); }
    @PatchMapping("/{id}/lock") public UserDetails lock(@CurrentUser UserPrincipal principal,@PathVariable Long id,@RequestBody LockRequest body) {
        return service.transition(principal.getId(),id,true,body.reason());
    }
    @PatchMapping("/{id}/unlock") public UserDetails unlock(@CurrentUser UserPrincipal principal,@PathVariable Long id) {
        return service.transition(principal.getId(),id,false,null);
    }
}
