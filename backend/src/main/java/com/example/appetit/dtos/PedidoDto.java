package com.example.appetit.dtos;

import com.example.appetit.enuns.StatusPedido;
import com.example.appetit.enuns.Tipo;

import java.util.List;

public record PedidoDto(
        String id,
        StatusPedido status,
        String criadoEm,
        ClienteDto cliente,
        RecebimentoDto recebimento,
        List<ItemDto> itens,
        String observacoes,
        long subtotalCentavos,
        long taxaEntregaCentavos,
        long totalCentavos
) {
    public record ClienteDto(String nome, String telefone, String email) {
    }

    public record RecebimentoDto(Tipo tipo, EnderecoDto endereco) {
    }

    public record EnderecoDto(String cep, String logradouro, String numero, String bairro, String complemento) {
    }

    public record ItemDto(String pratoId, String nomePrato, int quantidade, long precoUnitarioCentavos, String imagemUrl) {
    }
}
