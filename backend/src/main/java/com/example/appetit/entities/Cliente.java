package com.example.appetit.entities;

import jakarta.persistence.Embeddable;

@Embeddable
public class Cliente {
    private String nome;
    private String telefone;
    private String email;

    protected Cliente() {
    }

    public Cliente(String nome, String telefone, String email) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
    }

    public String getNome() {
        return nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getEmail() {
        return email;
    }
}
