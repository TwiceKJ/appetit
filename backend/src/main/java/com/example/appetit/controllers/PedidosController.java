package com.example.appetit.controllers;

import com.example.appetit.dtos.AddPedidoDto;
import com.example.appetit.dtos.AtualizarStatusPedidoDto;
import com.example.appetit.dtos.CreatedPedidoDto;
import com.example.appetit.dtos.PedidoDto;
import com.example.appetit.dtos.StatusPedidoDto;
import com.example.appetit.services.PedidosService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/pedidos")
public class PedidosController {

    private final PedidosService service;

    public PedidosController(PedidosService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CreatedPedidoDto> addPedido(@RequestBody AddPedidoDto dto) {
        CreatedPedidoDto created = service.addPedido(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public PedidoDto getPedido(@PathVariable UUID id) {
        return service.getPedido(id);
    }

    @PatchMapping("/{id}/status")
    public StatusPedidoDto atualizarStatus(@PathVariable UUID id, @RequestBody AtualizarStatusPedidoDto dto) {
        return service.atualizarStatus(id, dto);
    }
}
