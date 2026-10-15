const CHAVE = "appetit:pedidos-confirmados";
const ID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lerReferenciasPedidos() {
  try {
    const ids = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    const referencias = Array.isArray(ids) ? ids.filter(id => typeof id === "string" && ID_VALIDO.test(id)) : [];
    // Recupera referências reais da versão anterior, ainda abertas nesta sessão.
    try {
      const sessao = globalThis.window?.sessionStorage;
      for (let indice = 0; indice < (sessao?.length ?? 0); indice++) {
        const chave = sessao.key(indice);
        if (chave?.startsWith("appetit-pedido-confirmado:")) {
          const id = chave.slice("appetit-pedido-confirmado:".length);
          if (ID_VALIDO.test(id)) referencias.push(id);
        }
      }
    } catch {
      // A sessão antiga é opcional; uma falha nela não apaga o histórico novo.
    }
    return [...new Set(referencias)];
  } catch {
    return [];
  }
}

export function registrarPedido(id) {
  if (!ID_VALIDO.test(id)) return;
  try {
    // Persistimos somente referências: detalhes e status vêm sempre da API.
    const ids = [id, ...lerReferenciasPedidos().filter(atual => atual !== id)];
    localStorage.setItem(CHAVE, JSON.stringify(ids));
  } catch {
    // O endereço /pedido/:id ainda permite abrir o pedido sem armazenamento.
  }
}
