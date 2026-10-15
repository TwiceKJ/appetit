package com.example.appetit.controllers;

import com.example.appetit.dtos.PratoDto;
import com.example.appetit.services.PratosService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pratos")
public class PratosController {
    private final PratosService pratosService;

    public PratosController(PratosService pratosService) {
        this.pratosService = pratosService;
    }

    @GetMapping
    public List<PratoDto> listar() {
        return pratosService.listarDisponiveis();
    }

    @GetMapping("/{id}")
    public PratoDto getPrato(@PathVariable String id) {
        return pratosService.getPrato(id);
    }
}
