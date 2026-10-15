package com.example.appetit.services;

import com.example.appetit.dtos.AddPedidoDto;
import com.example.appetit.dtos.CreatedPedidoDto;
import com.example.appetit.dtos.AtualizarStatusPedidoDto;
import com.example.appetit.dtos.PedidoDto;
import com.example.appetit.dtos.StatusPedidoDto;
import com.example.appetit.entities.Cliente;
import com.example.appetit.entities.Endereco;
import com.example.appetit.entities.ItemPedido;
import com.example.appetit.entities.Pedido;
import com.example.appetit.entities.Prato;
import com.example.appetit.entities.Recebimento;
import com.example.appetit.enuns.Tipo;
import com.example.appetit.enuns.StatusPedido;
import com.example.appetit.repositories.PedidosRepository;
import com.example.appetit.repositories.PratosRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PedidosService {
    private final PedidosRepository pedidosRepository;
    private final PratosRepository pratosRepository;
    private final long taxaEntregaCentavos;

    public PedidosService(PedidosRepository pedidosRepository, PratosRepository pratosRepository,
                          @Value("${appetit.taxa-entrega-centavos}") long taxaEntregaCentavos) {
        this.pedidosRepository = pedidosRepository;
        this.pratosRepository = pratosRepository;
        this.taxaEntregaCentavos = taxaEntregaCentavos;
    }

    @Transactional
    public CreatedPedidoDto addPedido(AddPedidoDto dto) {
        if (dto == null || dto.cliente() == null || dto.recebimento() == null) {
            throw pedidoInvalido("Informe cliente e recebimento");
        }

        Cliente cliente = criarCliente(dto.cliente());
        Recebimento recebimento = criarRecebimento(dto.recebimento());
        List<ItemPedido> itens = criarItens(dto.itens());
        String observacoes = textoOpcional(dto.observacoes(), "Observações", 1000);

        Pedido novoPedido = new Pedido(cliente, recebimento, itens, observacoes);
        novoPedido.setTaxaEntregaCentavos(recebimento.getTipo() == Tipo.entrega ? taxaEntregaCentavos : 0L);
        Pedido pedido = pedidosRepository.saveAndFlush(novoPedido);
        return new CreatedPedidoDto(pedido.getId().toString());
    }

    @Transactional
    public StatusPedidoDto atualizarStatus(UUID id, AtualizarStatusPedidoDto dto) {
        if (dto == null || dto.status() == null) {
            throw pedidoInvalido("Informe o novo status do pedido");
        }

        Pedido pedido = pedidosRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
        StatusPedido status = dto.status();
        Tipo tipo = pedido.getRecebimento().getTipo();
        if ((status == StatusPedido.PRONTO_PARA_RETIRADA && tipo != Tipo.retirada)
                || (status == StatusPedido.SAIU_PARA_ENTREGA && tipo != Tipo.entrega)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Status incompatível com o tipo de recebimento");
        }

        pedido.setStatus(status);
        pedido.setStatusAtualizadoEm(Instant.now().toString());
        pedidosRepository.saveAndFlush(pedido);
        return new StatusPedidoDto(pedido.getId().toString(), pedido.getStatus());
    }

    @Transactional(readOnly = true)
    public PedidoDto getPedido(UUID id) {
        Pedido pedido = pedidosRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));

        Cliente cliente = pedido.getCliente();
        Recebimento recebimento = pedido.getRecebimento();
        Endereco endereco = recebimento.getEndereco();
        List<PedidoDto.ItemDto> itens = pedido.getItens().stream().map(item -> {
            String imagemUrl = pratosRepository.findById(item.getPratoId())
                    .map(Prato::getImagemUrl).orElse(null);
            return new PedidoDto.ItemDto(item.getPratoId(), item.getNomePrato(),
                    item.getQuantidade(), item.getPrecoUnitarioCentavos(), imagemUrl);
        }).toList();
        long subtotalCentavos = itens.stream()
                .mapToLong(item -> item.precoUnitarioCentavos() * item.quantidade()).sum();
        long taxaCentavos = pedido.getTaxaEntregaCentavos() != null
                ? pedido.getTaxaEntregaCentavos()
                : recebimento.getTipo() == Tipo.entrega ? taxaEntregaCentavos : 0;

        return new PedidoDto(
                pedido.getId().toString(),
                pedido.getStatus(),
                pedido.getCriadoEm(),
                new PedidoDto.ClienteDto(cliente.getNome(), cliente.getTelefone(), cliente.getEmail()),
                new PedidoDto.RecebimentoDto(recebimento.getTipo(), endereco == null ? null
                        : new PedidoDto.EnderecoDto(endereco.getCep(), endereco.getLogradouro(),
                        endereco.getNumero(), endereco.getBairro(), endereco.getComplemento())),
                itens,
                pedido.getObservacoes(),
                subtotalCentavos,
                taxaCentavos,
                subtotalCentavos + taxaCentavos
        );
    }

    private Cliente criarCliente(AddPedidoDto.ClienteDto dto) {
        String nome = textoObrigatorio(dto.nome(), "Nome", 255);
        if (nome.length() < 3 || nome.codePoints().noneMatch(Character::isLetter)) {
            throw pedidoInvalido("Informe um nome válido");
        }

        String telefone = textoObrigatorio(dto.telefone(), "Telefone", 255);
        if (!telefone.matches("[1-9]\\d(?:\\d{8}|9\\d{8})")) {
            throw pedidoInvalido("Informe um telefone com DDD e 10 ou 11 dígitos");
        }

        String email = textoOpcional(dto.email(), "E-mail", 255);
        if (email != null && !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
            throw pedidoInvalido("Informe um e-mail válido");
        }
        return new Cliente(nome, telefone, email);
    }

    private Recebimento criarRecebimento(AddPedidoDto.RecebimentoDto dto) {
        if (dto.tipo() == null) {
            throw pedidoInvalido("Escolha entrega ou retirada");
        }
        if (dto.tipo() == Tipo.retirada) {
            return new Recebimento(Tipo.retirada, null);
        }

        AddPedidoDto.EnderecoDto enderecoDto = dto.endereco();
        if (enderecoDto == null) {
            throw pedidoInvalido("Informe o endereço de entrega");
        }
        String cep = textoObrigatorio(enderecoDto.cep(), "CEP", 8);
        if (!cep.matches("\\d{8}")) {
            throw pedidoInvalido("Informe um CEP com 8 dígitos");
        }
        Endereco endereco = new Endereco(
                cep,
                textoObrigatorio(enderecoDto.logradouro(), "Logradouro", 255),
                textoObrigatorio(enderecoDto.numero(), "Número", 255),
                textoObrigatorio(enderecoDto.bairro(), "Bairro", 255),
                textoOpcional(enderecoDto.complemento(), "Complemento", 255)
        );
        return new Recebimento(Tipo.entrega, endereco);
    }

    private List<ItemPedido> criarItens(List<AddPedidoDto.ItemDto> itensDto) {
        if (itensDto == null || itensDto.isEmpty()) {
            throw pedidoInvalido("Adicione pelo menos um prato");
        }

        List<ItemPedido> itens = new ArrayList<>(itensDto.size());
        Set<String> ids = new HashSet<>();
        for (AddPedidoDto.ItemDto item : itensDto) {
            if (item == null) {
                throw pedidoInvalido("Informe um prato válido");
            }
            String pratoId = textoObrigatorio(item.pratoId(), "ID do prato", 16);
            if (item.quantidade() == null || item.quantidade() <= 0) {
                throw pedidoInvalido("A quantidade deve ser maior que zero");
            }
            if (!ids.add(pratoId)) {
                throw pedidoInvalido("O mesmo prato foi informado mais de uma vez");
            }

            Prato prato = pratosRepository.findById(pratoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prato não encontrado: " + pratoId));
            if (!prato.isDisponivel()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Prato indisponível: " + pratoId);
            }
            itens.add(new ItemPedido(prato.getId(), prato.getNome(), item.quantidade(), prato.getPrecoCentavos()));
        }
        return itens;
    }

    private String textoObrigatorio(String valor, String campo, int tamanhoMaximo) {
        String texto = textoOpcional(valor, campo, tamanhoMaximo);
        if (texto == null) {
            throw pedidoInvalido("Informe " + campo);
        }
        return texto;
    }

    private String textoOpcional(String valor, String campo, int tamanhoMaximo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String texto = valor.trim();
        if (texto.length() > tamanhoMaximo) {
            throw pedidoInvalido(campo + " excede " + tamanhoMaximo + " caracteres");
        }
        return texto;
    }

    private ResponseStatusException pedidoInvalido(String mensagem) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
    }
}
