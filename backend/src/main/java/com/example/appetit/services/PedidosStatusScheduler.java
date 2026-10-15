package com.example.appetit.services;

import com.example.appetit.entities.Pedido;
import com.example.appetit.enuns.StatusPedido;
import com.example.appetit.enuns.Tipo;
import com.example.appetit.repositories.PedidosRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@ConditionalOnProperty(name = "appetit.status-automatico.habilitado", havingValue = "true")
public class PedidosStatusScheduler {
    private static final List<StatusPedido> STATUS_EM_ANDAMENTO = List.of(
            StatusPedido.CONFIRMADO,
            StatusPedido.EM_PREPARO,
            StatusPedido.PRONTO_PARA_RETIRADA,
            StatusPedido.SAIU_PARA_ENTREGA
    );

    private final PedidosRepository pedidosRepository;
    private final long segundosPorEtapa;

    public PedidosStatusScheduler(PedidosRepository pedidosRepository,
                                  @Value("${appetit.status-automatico.segundos-por-etapa:20}") long segundosPorEtapa) {
        this.pedidosRepository = pedidosRepository;
        this.segundosPorEtapa = Math.max(1, segundosPorEtapa);
    }

    @Scheduled(fixedDelayString = "${appetit.status-automatico.intervalo-ms:5000}")
    @Transactional
    public void avancarStatus() {
        Instant agora = Instant.now();
        List<Pedido> alterados = new ArrayList<>();
        for (Pedido pedido : pedidosRepository.findByStatusIn(STATUS_EM_ANDAMENTO)) {
            Instant inicio;
            try {
                inicio = Instant.parse(pedido.getStatusAtualizadoEm());
            } catch (DateTimeParseException | NullPointerException erro) {
                pedido.setStatusAtualizadoEm(agora.toString());
                alterados.add(pedido);
                continue;
            }
            if (Duration.between(inicio, agora).getSeconds() < segundosPorEtapa) {
                continue;
            }

            pedido.setStatus(proximoStatus(pedido));
            pedido.setStatusAtualizadoEm(agora.toString());
            alterados.add(pedido);
        }
        if (!alterados.isEmpty()) {
            pedidosRepository.saveAllAndFlush(alterados);
        }
    }

    private StatusPedido proximoStatus(Pedido pedido) {
        return switch (pedido.getStatus()) {
            case CONFIRMADO -> StatusPedido.EM_PREPARO;
            case EM_PREPARO -> pedido.getRecebimento().getTipo() == Tipo.retirada
                    ? StatusPedido.PRONTO_PARA_RETIRADA : StatusPedido.SAIU_PARA_ENTREGA;
            case PRONTO_PARA_RETIRADA, SAIU_PARA_ENTREGA -> StatusPedido.CONCLUIDO;
            default -> pedido.getStatus();
        };
    }
}

