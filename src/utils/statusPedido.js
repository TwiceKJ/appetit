export function descreverStatus(status, retirada) {
  const estados = {
    CONFIRMADO: { titulo: "Pedido confirmado", indice: 0 },
    EM_PREPARO: { titulo: "Em preparo", indice: 1 },
    PRONTO_PARA_RETIRADA: { titulo: "Pronto para retirada", indice: 2 },
    SAIU_PARA_ENTREGA: { titulo: "Saiu para entrega", indice: 2 },
    CONCLUIDO: { titulo: retirada ? "Pedido retirado" : "Pedido entregue", indice: 3 },
    CANCELADO: { titulo: "Pedido cancelado", indice: -1 },
  };
  return estados[status] ?? { titulo: "Status ainda não informado", indice: -1 };
}
