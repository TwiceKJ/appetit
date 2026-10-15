package com.example.appetit.entities;

import com.example.appetit.enuns.Tipo;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public class Recebimento {
    @Enumerated(EnumType.STRING)
    private Tipo tipo;

    @Embedded
    private Endereco endereco;

    protected Recebimento() {
    }

    public Recebimento(Tipo tipo, Endereco endereco) {
        this.tipo = tipo;
        this.endereco = endereco;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public Endereco getEndereco() {
        return endereco;
    }
}
