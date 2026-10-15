package com.example.appetit.dtos;

public record PratoDto(
        String id,
        String nome,
        String categoria,
        long precoCentavos,
        String imagemUrl
) {
}
