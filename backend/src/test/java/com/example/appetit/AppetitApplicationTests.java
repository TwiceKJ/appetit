package com.example.appetit;

import com.example.appetit.entities.Cliente;
import com.example.appetit.entities.Endereco;
import com.example.appetit.entities.ItemPedido;
import com.example.appetit.entities.Pedido;
import com.example.appetit.entities.Recebimento;
import com.example.appetit.enuns.Tipo;
import com.example.appetit.repositories.PedidosRepository;
import com.example.appetit.repositories.PratosRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite:target/appetit-test.db",
        "appetit.status-automatico.habilitado=false"
})
@AutoConfigureMockMvc
class AppetitApplicationTests {
    @Autowired
    private PedidosRepository pedidosRepository;

    @Autowired
    private PratosRepository pratosRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void carregaOsPratosDoCardapioNoSqlite() {
        assertEquals(28, pratosRepository.count());
        assertEquals(5200L, pratosRepository.findById("52904").orElseThrow().getPrecoCentavos());
        assertEquals(3200L, pratosRepository.findById("52914").orElseThrow().getPrecoCentavos());
        assertEquals(2500L, pratosRepository.findById("52917").orElseThrow().getPrecoCentavos());
    }

    @Test
    void listaPratosComPrecosDoBanco() throws Exception {
        mockMvc.perform(get("/api/pratos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(28))
                .andExpect(jsonPath("$[0].id").value("52904"))
                .andExpect(jsonPath("$[0].precoCentavos").value(5200));

        mockMvc.perform(get("/api/pratos/52904"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Beef Bourguignon"))
                .andExpect(jsonPath("$.precoCentavos").value(5200));

        mockMvc.perform(get("/api/pratos/inexistente"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void gravaELePedidoNoSqlite() {
        Pedido pedido = new Pedido(
                new Cliente("Ana Silva", "11999999999", null),
                new Recebimento(Tipo.entrega, new Endereco("01001000", "Rua das Flores", "123", "Centro", null)),
                List.of(new ItemPedido("52904", "Beef Bourguignon", 2, 5200L)),
                "Sem cebola"
        );

        Pedido salvo = pedidosRepository.saveAndFlush(pedido);
        entityManager.clear();

        Pedido carregado = pedidosRepository.findById(salvo.getId()).orElseThrow();
        assertEquals("11999999999", carregado.getCliente().getTelefone());
        assertEquals(Tipo.entrega, carregado.getRecebimento().getTipo());
        assertEquals("01001000", carregado.getRecebimento().getEndereco().getCep());
        assertEquals("52904", carregado.getItens().getFirst().getPratoId());
        assertEquals(5200L, carregado.getItens().getFirst().getPrecoUnitarioCentavos());
        assertEquals("Sem cebola", carregado.getObservacoes());
    }
}
