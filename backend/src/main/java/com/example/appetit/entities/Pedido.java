package com.example.appetit.entities;

import com.example.appetit.enuns.StatusPedido;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Embedded
    private Cliente cliente;

    @Embedded
    private Recebimento recebimento;

    @ElementCollection
    @CollectionTable(name = "pedido_itens", joinColumns = @JoinColumn(name = "pedido_id"))
    @OrderColumn(name = "posicao")
    private List<ItemPedido> itens = new ArrayList<>();

    @Column(length = 1000)
    private String observacoes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(32) default 'CONFIRMADO'")
    private StatusPedido status = StatusPedido.CONFIRMADO;

    // Pedidos anteriores à adição deste campo permanecem sem data registrada.
    @Column(name = "criado_em", length = 40)
    private String criadoEm = Instant.now().toString();

    // A taxa faz parte do valor confirmado e não deve mudar com a configuração futura.
    @Column(name = "taxa_entrega_centavos")
    private Long taxaEntregaCentavos;

    // Relógio das etapas automáticas; pedidos antigos começam ao iniciar o agendador.
    @Column(name = "status_atualizado_em", length = 40)
    private String statusAtualizadoEm = Instant.now().toString();

    public Pedido(Cliente cliente, Recebimento recebimento, List<ItemPedido> itens, String observacoes) {
        this.cliente = cliente;
        this.recebimento = recebimento;
        this.itens = new ArrayList<>(itens);
        this.observacoes = observacoes;
    }

    public Pedido() {
    }
}
