package com.example.demo.admin.entity;
import jakarta.persistence.*;
import lombok.*;
import com.example.demo.user.entity.User;
import java.time.LocalDateTime;
@Entity @Table(name="admin_user_action_logs") @Getter @Setter @NoArgsConstructor
public class AdminUserActionLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="admin_id") private User admin;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="target_user_id") private User targetUser;
    @Column(nullable=false, length=20) private String action;
    @Column(length=500, columnDefinition="NVARCHAR(500)") private String reason;
    @Column(nullable=false) private LocalDateTime createdAt;
}
