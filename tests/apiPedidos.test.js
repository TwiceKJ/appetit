import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarPedido, normalizarPedido } from '../src/services/pedidos.js';
import { buscarPratosDetalhados } from '../src/services/cardapio.js';
import { registrarPedido, lerReferenciasPedidos } from '../src/utils/historicoPedidos.js';
import { descreverStatus } from '../src/utils/statusPedido.js';

const id = '12345678-1234-1234-1234-123456789abc';
const dto = { id, status: 'EM_PREPARO', criadoEm: '2026-10-15T12:00:00Z', cliente: { nome: 'Teste' }, recebimento: { tipo: 'retirada', endereco: null },
  itens: [{ pratoId: '52904', nomePrato: 'Nome salvo no servidor', precoUnitarioCentavos: 5235, quantidade: 2, imagemUrl: '/prato.jpg' }],
  subtotalCentavos: 10470, taxaEntregaCentavos: 0, totalCentavos: 10470 };

test('consulta preserva status, preço e totais do backend convertendo centavos em reais', async () => {
  const pedido = await buscarPedido(id, { fetchImpl: async (url, opcoes) => {
    assert.equal(url, `/api/pedidos/${id}`);
    assert.equal(opcoes.cache, 'no-store');
    return { ok: true, json: async () => dto };
  } });
  assert.equal(pedido.status, 'EM_PREPARO');
  assert.equal(pedido.itens[0].nome, 'Nome salvo no servidor');
  assert.equal(pedido.itens[0].preco, 52.35);
  assert.deepEqual(pedido.valores, { quantidadeTotal: 2, subtotal: 104.7, taxaEntrega: 0, total: 104.7 });
});

test('pedido ausente ou resposta de outro pedido não vira confirmação local', async () => {
  await assert.rejects(buscarPedido(id, { fetchImpl: async () => ({ ok: false, status: 404 }) }), /não encontrado/);
  await assert.rejects(buscarPedido(id, { fetchImpl: async () => ({ ok: true, json: async () => ({ ...dto, id: 'outro' }) }) }), /outro pedido/);
  assert.throws(() => normalizarPedido({ id }), /detalhes inválidos/);
});

test('catálogo usa nome e preço do backend, mesmo que difiram do preço antigo', async () => {
  const pratos = await buscarPratosDetalhados({ fetchImpl: async url => {
    assert.equal(url, '/api/pratos');
    return { ok: true, json: async () => [{ id: '52904', nome: 'Nome novo', categoria: 'Carnes', precoCentavos: 6175, imagemUrl: '/novo.jpg' }] };
  } });
  assert.equal(pratos[0].nome, 'Nome novo');
  assert.equal(pratos[0].preco, 61.75);
});

test('histórico persiste apenas IDs reais, evita repetição e sobrevive à releitura', () => {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const itens = new Map();
  globalThis.localStorage = { getItem: chave => itens.get(chave) ?? null, setItem: (chave, valor) => itens.set(chave, valor) };
  try {
    registrarPedido('SIM-1');
    registrarPedido(id);
    registrarPedido(id);
    assert.deepEqual(lerReferenciasPedidos(), [id]);
    assert.equal(itens.get('appetit:pedidos-confirmados'), JSON.stringify([id]));
    itens.set('appetit:pedidos-confirmados', '{');
    assert.deepEqual(lerReferenciasPedidos(), []);
  } finally {
    if (anterior === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', anterior);
  }
});

test('histórico indisponível não interrompe o pedido confirmado', () => {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  globalThis.localStorage = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  try {
    assert.doesNotThrow(() => registrarPedido(id));
    assert.deepEqual(lerReferenciasPedidos(), []);
  } finally {
    if (anterior === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', anterior);
  }
});

test('status cancelado, concluído e desconhecido não aparecem como confirmado', () => {
  assert.deepEqual(descreverStatus('CANCELADO', false), { titulo: 'Pedido cancelado', indice: -1 });
  assert.equal(descreverStatus('CONCLUIDO', true).titulo, 'Pedido retirado');
  assert.equal(descreverStatus('CONCLUIDO', false).titulo, 'Pedido entregue');
  assert.equal(descreverStatus('NOVO_STATUS', false).indice, -1);
});


test('recupera IDs reais da sessão antiga e ignora confirmações simuladas', () => {
  const storageAnterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const janelaAnterior = globalThis.window;
  const chaves = [`appetit-pedido-confirmado:${id}`, 'appetit-pedido-confirmado:SIM-1'];
  globalThis.localStorage = { getItem: () => '[]' };
  globalThis.window = { sessionStorage: { length: 2, key: indice => chaves[indice] } };
  try {
    assert.deepEqual(lerReferenciasPedidos(), [id]);
  } finally {
    if (storageAnterior) Object.defineProperty(globalThis, 'localStorage', storageAnterior);
    else delete globalThis.localStorage;
    if (janelaAnterior === undefined) delete globalThis.window;
    else globalThis.window = janelaAnterior;
  }
});
