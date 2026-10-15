package com.example.appetit;

import com.example.appetit.entities.Cliente;
import com.example.appetit.entities.Pedido;
import com.example.appetit.entities.Recebimento;
import com.example.appetit.enuns.StatusPedido;
import com.example.appetit.enuns.Tipo;
import com.example.appetit.repositories.PedidosRepository;
import com.example.appetit.services.PedidosStatusScheduler;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PedidosStatusSchedulerTest {
    @Test
    void avancaEntregaUmaEtapaPorVez() {
        Pedido pedido = pedido(Tipo.entrega);
        PedidosStatusScheduler scheduler = scheduler(pedido);

        avancarRelogio(pedido, scheduler);
        assertEquals(StatusPedido.EM_PREPARO, pedido.getStatus());

        avancarRelogio(pedido, scheduler);
        assertEquals(StatusPedido.SAIU_PARA_ENTREGA, pedido.getStatus());

        avancarRelogio(pedido, scheduler);
        assertEquals(StatusPedido.CONCLUIDO, pedido.getStatus());
    }

    @Test
    void avancaRetiradaParaProntoEIniciaRelogioDePedidoAntigo() {
        Pedido pedido = pedido(Tipo.retirada);
        pedido.setStatusAtualizadoEm(null);
        PedidosStatusScheduler scheduler = scheduler(pedido);

        scheduler.avancarStatus();
        assertEquals(StatusPedido.CONFIRMADO, pedido.getStatus());
        assertNotNull(pedido.getStatusAtualizadoEm());

        avancarRelogio(pedido, scheduler);
        avancarRelogio(pedido, scheduler);
        assertEquals(StatusPedido.PRONTO_PARA_RETIRADA, pedido.getStatus());
    }

    private Pedido pedido(Tipo tipo) {
        return new Pedido(new Cliente("Ana Silva", "11999999999", null),
                new Recebimento(tipo, null), List.of(), null);
    }

    private PedidosStatusScheduler scheduler(Pedido pedido) {
        PedidosRepository repositorio = mock(PedidosRepository.class);
        when(repositorio.findByStatusIn(anyList())).thenReturn(List.of(pedido));
        return new PedidosStatusScheduler(repositorio, 20);
    }

    private void avancarRelogio(Pedido pedido, PedidosStatusScheduler scheduler) {
        pedido.setStatusAtualizadoEm(Instant.now().minusSeconds(21).toString());
        scheduler.avancarStatus();
    }
}

