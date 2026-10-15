package com.example.demo.grammar.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class AuthorDto {
    private String name;
    private String email;

    public AuthorDto() {
    }

    @Builder
    public AuthorDto(String name, String email) {
        this.name = name;
        this.email = email;
    }
}
