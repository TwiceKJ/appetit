package com.example.appetit.dtos;

import com.example.appetit.enuns.Tipo;

import java.util.List;

public record AddPedidoDto(
        ClienteDto cliente,
        RecebimentoDto recebimento,
        List<ItemDto> itens,
        String observacoes
) {
    public record ClienteDto(String nome, String telefone, String email) {
    }

    public record RecebimentoDto(Tipo tipo, EnderecoDto endereco) {
    }

    public record EnderecoDto(
            String cep,
            String logradouro,
            String numero,
            String bairro,
            String complemento
    ) {
    }

    public record ItemDto(String pratoId, Integer quantidade) {
    }
}
