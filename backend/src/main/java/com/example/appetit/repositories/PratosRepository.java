package com.example.appetit.repositories;

import com.example.appetit.entities.Prato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PratosRepository extends JpaRepository<Prato, String> {
    List<Prato> findByDisponivelTrueOrderByNomeAsc();
}
