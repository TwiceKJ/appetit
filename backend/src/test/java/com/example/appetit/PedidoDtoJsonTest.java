package com.example.appetit;

import com.example.appetit.dtos.AddPedidoDto;
import com.example.appetit.dtos.CreatedPedidoDto;
import com.example.appetit.enuns.Tipo;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PedidoDtoJsonTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void recebeOContratoEnviadoPeloFrontend() {
        String json = """
                {
                  "cliente": {"nome": "Ana Silva", "telefone": "11999999999", "email": null},
                  "recebimento": {
                    "tipo": "entrega",
                    "endereco": {
                      "cep": "01001000", "logradouro": "Rua das Flores", "numero": "123",
                      "bairro": "Centro", "complemento": null
                    }
                  },
                  "itens": [{"pratoId": "52904", "quantidade": 2}],
                  "observacoes": "Sem cebola"
                }
                """;

        AddPedidoDto pedido = mapper.readValue(json, AddPedidoDto.class);

        assertEquals("11999999999", pedido.cliente().telefone());
        assertEquals(Tipo.entrega, pedido.recebimento().tipo());
        assertEquals("01001000", pedido.recebimento().endereco().cep());
        assertEquals("52904", pedido.itens().getFirst().pratoId());
        assertEquals(2, pedido.itens().getFirst().quantidade());
        assertEquals("Sem cebola", pedido.observacoes());
        assertNull(pedido.cliente().email());
    }

    @Test
    void devolveOIdEsperadoPeloFrontend() {
        String json = mapper.writeValueAsString(new CreatedPedidoDto("pedido-123"));

        assertEquals("pedido-123", mapper.readTree(json).get("id").asString());
    }
}
