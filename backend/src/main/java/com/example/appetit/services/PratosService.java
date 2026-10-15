package com.example.appetit.services;

import com.example.appetit.dtos.PratoDto;
import com.example.appetit.entities.Prato;
import com.example.appetit.repositories.PratosRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PratosService {

    private final PratosRepository pratosRepository;

    public PratosService(PratosRepository pratosRepository) {
        this.pratosRepository = pratosRepository;
    }

    @Transactional(readOnly = true)
    public List<PratoDto> listarDisponiveis() {
        return pratosRepository.findByDisponivelTrueOrderByNomeAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PratoDto getPrato(String id) {
        return pratosRepository.findById(id)
                .filter(Prato::isDisponivel)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prato não encontrado"));
    }

    private PratoDto toDto(Prato prato) {
        return new PratoDto(
                prato.getId(),
                prato.getNome(),
                prato.getCategoria(),
                prato.getPrecoCentavos(),
                prato.getImagemUrl());
    }
}
