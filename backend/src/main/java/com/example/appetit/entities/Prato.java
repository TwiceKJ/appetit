package com.example.appetit.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "pratos")
public class Prato {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String categoria;

    @Column(name = "preco_centavos", nullable = false)
    private long precoCentavos;

    @Column(name = "imagem_url", length = 500)
    private String imagemUrl;

    @Column(nullable = false)
    private boolean disponivel = true;

    protected Prato() {
    }
}
