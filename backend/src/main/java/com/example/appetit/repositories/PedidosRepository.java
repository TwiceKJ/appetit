package com.example.appetit.repositories;

import com.example.appetit.entities.Pedido;
import com.example.appetit.enuns.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PedidosRepository extends JpaRepository<Pedido, UUID> {
    List<Pedido> findByStatusIn(List<StatusPedido> status);
}
