package com.example.appetit.entities;

import jakarta.persistence.Embeddable;

@Embeddable
public class ItemPedido {
    private String pratoId;
    private String nomePrato;
    private Integer quantidade;
    private Long precoUnitarioCentavos;

    protected ItemPedido() {
    }

    public ItemPedido(String pratoId, String nomePrato, Integer quantidade, Long precoUnitarioCentavos) {
        this.pratoId = pratoId;
        this.nomePrato = nomePrato;
        this.quantidade = quantidade;
        this.precoUnitarioCentavos = precoUnitarioCentavos;
    }

    public String getPratoId() {
        return pratoId;
    }

    public String getNomePrato() {
        return nomePrato;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public Long getPrecoUnitarioCentavos() {
        return precoUnitarioCentavos;
    }
}
