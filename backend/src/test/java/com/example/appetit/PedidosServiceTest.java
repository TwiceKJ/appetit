package com.example.appetit;

import com.example.appetit.dtos.AddPedidoDto;
import com.example.appetit.dtos.CreatedPedidoDto;
import com.example.appetit.entities.Pedido;
import com.example.appetit.entities.Prato;
import com.example.appetit.enuns.StatusPedido;
import com.example.appetit.enuns.Tipo;
import com.example.appetit.repositories.PedidosRepository;
import com.example.appetit.repositories.PratosRepository;
import com.example.appetit.services.PedidosService;
import com.example.appetit.services.PedidosStatusScheduler;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite:target/appetit-test.db",
        "appetit.status-automatico.habilitado=false"
})
@AutoConfigureMockMvc
@Transactional
class PedidosServiceTest {
    @Autowired
    private PedidosService service;

    @Autowired
    private PedidosRepository pedidosRepository;

    @Autowired
    private PratosRepository pratosRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void salvaPedidoComPrecoAtualDoBanco() {
        Prato prato = pratosRepository.findById("52904").orElseThrow();
        prato.setPrecoCentavos(6100);
        pratosRepository.saveAndFlush(prato);

        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.entrega, "52904", 2));
        assertNotNull(criado.id());
        entityManager.clear();

        Pedido salvo = pedidosRepository.findById(UUID.fromString(criado.id())).orElseThrow();
        assertEquals("Ana Silva", salvo.getCliente().getNome());
        assertEquals(Tipo.entrega, salvo.getRecebimento().getTipo());
        assertEquals("01001000", salvo.getRecebimento().getEndereco().getCep());
        assertEquals("52904", salvo.getItens().getFirst().getPratoId());
        assertEquals("Beef Bourguignon", salvo.getItens().getFirst().getNomePrato());
        assertEquals(2, salvo.getItens().getFirst().getQuantidade());
        assertEquals(6100L, salvo.getItens().getFirst().getPrecoUnitarioCentavos());
        assertEquals(StatusPedido.CONFIRMADO, salvo.getStatus());
        assertEquals(1000L, salvo.getTaxaEntregaCentavos());
    }

    @Test
    void salvaRetiradaSemEndereco() {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.retirada, "52904", 1));
        entityManager.clear();

        Pedido salvo = pedidosRepository.findById(UUID.fromString(criado.id())).orElseThrow();
        assertEquals(Tipo.retirada, salvo.getRecebimento().getTipo());
        assertNull(salvo.getRecebimento().getEndereco());
        assertEquals(0L, salvo.getTaxaEntregaCentavos());
    }

    @Test
    void rejeitaPratoInexistente() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.addPedido(pedido(Tipo.retirada, "inexistente", 1)));
        assertEquals(HttpStatus.NOT_FOUND, erro.getStatusCode());
    }

    @Test
    void rejeitaPratoIndisponivel() {
        Prato prato = pratosRepository.findById("52904").orElseThrow();
        prato.setDisponivel(false);
        pratosRepository.saveAndFlush(prato);

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.addPedido(pedido(Tipo.retirada, "52904", 1)));
        assertEquals(HttpStatus.CONFLICT, erro.getStatusCode());
    }

    @Test
    void rejeitaQuantidadeInvalida() {
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.addPedido(pedido(Tipo.retirada, "52904", 0)));
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
    }

    @Test
    void rejeitaEnderecoAusenteNaEntrega() {
        AddPedidoDto dto = pedido(Tipo.entrega, "52904", 1);
        AddPedidoDto semEndereco = new AddPedidoDto(dto.cliente(),
                new AddPedidoDto.RecebimentoDto(Tipo.entrega, null), dto.itens(), null);

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> service.addPedido(semEndereco));
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
    }

    @Test
    void patchAtualizaStatusEGravaNoBanco() throws Exception {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.entrega, "52904", 1));

        mockMvc.perform(patch("/api/pedidos/{id}/status", criado.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"EM_PREPARO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(criado.id()))
                .andExpect(jsonPath("$.status").value("EM_PREPARO"));

        entityManager.clear();
        Pedido salvo = pedidosRepository.findById(UUID.fromString(criado.id())).orElseThrow();
        assertEquals(StatusPedido.EM_PREPARO, salvo.getStatus());

        mockMvc.perform(get("/api/pedidos/{id}", criado.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_PREPARO"));
    }

    @Test
    void patchRejeitaStatusIncompativelComEntrega() throws Exception {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.entrega, "52904", 1));

        mockMvc.perform(patch("/api/pedidos/{id}/status", criado.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PRONTO_PARA_RETIRADA\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void patchRejeitaPedidoInexistenteEStatusAusente() throws Exception {
        mockMvc.perform(patch("/api/pedidos/{id}/status", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"EM_PREPARO\"}"))
                .andExpect(status().isNotFound());

        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.retirada, "52904", 1));
        mockMvc.perform(patch("/api/pedidos/{id}/status", criado.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getDevolvePedidoSalvoComPrecosDaCompra() throws Exception {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.entrega, "52904", 2));
        Prato prato = pratosRepository.findById("52904").orElseThrow();
        prato.setPrecoCentavos(9000);
        pratosRepository.saveAndFlush(prato);
        entityManager.clear();

        mockMvc.perform(get("/api/pedidos/{id}", criado.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(criado.id()))
                .andExpect(jsonPath("$.status").value("CONFIRMADO"))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty())
                .andExpect(jsonPath("$.cliente.nome").value("Ana Silva"))
                .andExpect(jsonPath("$.recebimento.tipo").value("entrega"))
                .andExpect(jsonPath("$.itens[0].nomePrato").value("Beef Bourguignon"))
                .andExpect(jsonPath("$.itens[0].precoUnitarioCentavos").value(5200))
                .andExpect(jsonPath("$.subtotalCentavos").value(10400))
                .andExpect(jsonPath("$.taxaEntregaCentavos").value(1000))
                .andExpect(jsonPath("$.totalCentavos").value(11400));
    }

    @Test
    void getDevolveRetiradaSemTaxaE404ParaPedidoInexistente() throws Exception {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.retirada, "52904", 1));

        mockMvc.perform(get("/api/pedidos/{id}", criado.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taxaEntregaCentavos").value(0))
                .andExpect(jsonPath("$.recebimento.endereco").value(org.hamcrest.Matchers.nullValue()));

        mockMvc.perform(get("/api/pedidos/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void agendadorPersisteStatusQueOGetDevolve() throws Exception {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.entrega, "52904", 1));
        Pedido salvo = pedidosRepository.findById(UUID.fromString(criado.id())).orElseThrow();
        salvo.setStatusAtualizadoEm(Instant.now().minusSeconds(21).toString());
        pedidosRepository.saveAndFlush(salvo);

        new PedidosStatusScheduler(pedidosRepository, 20).avancarStatus();
        entityManager.clear();

        mockMvc.perform(get("/api/pedidos/{id}", criado.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_PREPARO"));
    }

    @Test
    void agendadorIniciaRelogioDePedidoAnterior() {
        CreatedPedidoDto criado = service.addPedido(pedido(Tipo.entrega, "52904", 1));
        Pedido salvo = pedidosRepository.findById(UUID.fromString(criado.id())).orElseThrow();
        salvo.setStatusAtualizadoEm(null);
        pedidosRepository.saveAndFlush(salvo);
        entityManager.clear();

        new PedidosStatusScheduler(pedidosRepository, 20).avancarStatus();
        entityManager.clear();

        Pedido atualizado = pedidosRepository.findById(UUID.fromString(criado.id())).orElseThrow();
        assertEquals(StatusPedido.CONFIRMADO, atualizado.getStatus());
        assertNotNull(atualizado.getStatusAtualizadoEm());
    }

    private AddPedidoDto pedido(Tipo tipo, String pratoId, int quantidade) {
        return new AddPedidoDto(
                new AddPedidoDto.ClienteDto("Ana Silva", "11999999999", null),
                new AddPedidoDto.RecebimentoDto(tipo, tipo == Tipo.entrega
                        ? new AddPedidoDto.EnderecoDto("01001000", "Rua das Flores", "123", "Centro", null)
                        : null),
                List.of(new AddPedidoDto.ItemDto(pratoId, quantidade)),
                "Sem cebola"
        );
    }
}

