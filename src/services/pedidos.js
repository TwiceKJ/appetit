export function criarServicoPedidos({
  url = "/api",
  fetchImpl = globalThis.fetch,
  tempoLimiteMs = 10000,
} = {}) {
  const baseUrl = (url.trim() || "/api").replace(/\/+$/, "");

  return async function enviarPedido(pedido) {
    const controller = new AbortController();
    const temporizador = setTimeout(() => controller.abort(), tempoLimiteMs);

    try {
      const resposta = await fetchImpl(`${baseUrl}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
        signal: controller.signal,
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível confirmar o pedido. Tente novamente.");
      }

      const dados = await resposta.json();
      // Contrato provisório: a API devolve { id: "identificador" }.
      if (!dados || !["string", "number"].includes(typeof dados.id) || !String(dados.id).trim()) {
        throw new Error("O serviço não retornou uma confirmação válida. Verifique o pedido antes de tentar novamente.");
      }

      return { id: String(dados.id), simulado: false };
    } catch (erro) {
      if (controller.signal.aborted) {
        throw new Error("O envio demorou demais. Verifique se o pedido foi recebido antes de tentar novamente.", { cause: erro });
      }
      if (erro instanceof TypeError) {
        throw new Error("Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.", { cause: erro });
      }
      if (erro instanceof SyntaxError) {
        throw new Error("O serviço não retornou uma confirmação válida. Verifique o pedido antes de tentar novamente.", { cause: erro });
      }
      throw erro;
    } finally {
      // Limpa o timeout tanto no sucesso quanto na falha.
      clearTimeout(temporizador);
    }
  };
}

// Adapta os centavos da API ao formato em reais usado pelos componentes.
export function normalizarPedido(dados) {
  if (!dados?.id || !dados.cliente || !dados.recebimento || !Array.isArray(dados.itens)
      || !Number.isFinite(dados.totalCentavos)) {
    throw new Error("O serviço retornou detalhes inválidos para o pedido.");
  }
  return {
    ...dados,
    simulado: false,
    itens: dados.itens.map(item => ({
      id: item.pratoId, nome: item.nomePrato, imagem: item.imagemUrl,
      preco: item.precoUnitarioCentavos / 100, quantidade: item.quantidade,
    })),
    valores: {
      quantidadeTotal: dados.itens.reduce((soma, item) => soma + item.quantidade, 0),
      subtotal: dados.subtotalCentavos / 100,
      taxaEntrega: dados.taxaEntregaCentavos / 100,
      total: dados.totalCentavos / 100,
    },
  };
}

export async function buscarPedido(id, { signal, url = "/api", fetchImpl = globalThis.fetch } = {}) {
  const baseUrl = (url.trim() || "/api").replace(/\/+$/, "");
  const resposta = await fetchImpl(`${baseUrl}/pedidos/${encodeURIComponent(id)}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (resposta.status === 404) throw new Error("Pedido não encontrado no servidor.");
  if (!resposta.ok) throw new Error("Não foi possível consultar o pedido. Tente novamente.");
  const dados = await resposta.json();
  if (String(dados?.id) !== String(id)) throw new Error("O serviço retornou outro pedido.");
  return normalizarPedido(dados);
}
