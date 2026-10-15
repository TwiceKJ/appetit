import test from "node:test";
import assert from "node:assert/strict";
import { montarPedido } from "../src/utils/montarPedido.js";
import { criarServicoPedidos } from "../src/services/pedidos.js";

const dados = {
  nome: "  Ana Silva  ", telefone: "(11) 99999-9999",
  "tipo-recebimento": "entrega", cep: "01001-000",
  endereco: " Praça da Sé ", numero: "S/N", bairro: "Sé",
};
const pratos = [
  { id: 1, quantidade: 2, preco: 48, nome: "Ratatouille" },
  { id: 4, quantidade: 0, preco: 44 },
];
const pedido = montarPedido(dados, pratos);

test("monta entrega, normaliza valores e envia somente IDs/quantidades positivas", () => {
  assert.deepEqual(pedido, {
    cliente: { nome: "Ana Silva", telefone: "11999999999", email: null },
    recebimento: { tipo: "entrega", endereco: {
      cep: "01001000", logradouro: "Praça da Sé", numero: "S/N", bairro: "Sé", complemento: null,
    } },
    itens: [{ pratoId: 1, quantidade: 2 }], observacoes: null,
  });
});

test("retirada omite endereço antigo e preserva campos opcionais preenchidos", () => {
  const resultado = montarPedido({ ...dados, "tipo-recebimento": "retirada", email: " ana@example.com ", observacoes: " Sem cebola " }, pratos);
  assert.equal(resultado.recebimento.endereco, null);
  assert.equal(resultado.cliente.email, "ana@example.com");
  assert.equal(resultado.observacoes, "Sem cebola");
});

test("pedido sem quantidades positivas tem lista vazia", () => {
  assert.deepEqual(montarPedido(dados, [{ id: 1, quantidade: 0 }]).itens, []);
});

test("sem URL configurada usa a API local real", async () => {
  const enviar = criarServicoPedidos({ url: "", fetchImpl: async (url) => {
    assert.equal(url, "/api/pedidos");
    return { ok: true, json: async () => ({ id: "pedido-real" }) };
  } });
  assert.deepEqual(await enviar(pedido), { id: "pedido-real", simulado: false });
});

test("API recebe POST JSON e resposta é normalizada", async () => {
  const enviar = criarServicoPedidos({ url: "https://example.test/api/", fetchImpl: async (url, opcoes) => {
    assert.equal(url, "https://example.test/api/pedidos");
    assert.equal(opcoes.method, "POST");
    assert.equal(opcoes.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(opcoes.body), pedido);
    assert.ok(opcoes.signal instanceof AbortSignal);
    return { ok: true, json: async () => ({ id: 123 }) };
  } });
  assert.deepEqual(await enviar(pedido), { id: "123", simulado: false });
});

test("erro HTTP não vira sucesso nem cai na simulação", async () => {
  const enviar = criarServicoPedidos({ url: "https://example.test", fetchImpl: async () => ({ ok: false }) });
  await assert.rejects(enviar(pedido), /Não foi possível confirmar/);
});

test("falha de conexão é traduzida e preserva a causa", async () => {
  const original = new TypeError("Failed to fetch");
  const enviar = criarServicoPedidos({ url: "https://example.test", fetchImpl: async () => { throw original; } });
  await assert.rejects(enviar(pedido), (erro) => {
    assert.match(erro.message, /conectar ao serviço/);
    assert.equal(erro.cause, original);
    return true;
  });
});

test("JSON inválido não é tratado como confirmação", async () => {
  const enviar = criarServicoPedidos({ url: "https://example.test", fetchImpl: async () => ({
    ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); },
  }) });
  await assert.rejects(enviar(pedido), /confirmação válida/);
});

test("respostas sem identificador válido são rejeitadas", async () => {
  for (const resposta of [null, {}, { id: "" }, { id: {} }]) {
    const enviar = criarServicoPedidos({ url: "https://example.test", fetchImpl: async () => ({ ok: true, json: async () => resposta }) });
    await assert.rejects(enviar(pedido), /confirmação válida/);
  }
});

test("tempo limite cancela a requisição e informa a falha", async () => {
  const enviar = criarServicoPedidos({
    url: "https://example.test", tempoLimiteMs: 5,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }),
  });
  await assert.rejects(enviar(pedido), /demorou demais/);
});
