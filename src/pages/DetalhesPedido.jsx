import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChefHat, CircleCheck, Clock, Copy, MapPin, Phone, ShoppingBag, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { enderecoRestaurante } from "../data/restaurante";
import { consultarPedido } from "../services/enviarPedido";
import { registrarPedido } from "../utils/historicoPedidos";
import { descreverStatus } from "../utils/statusPedido";
import "../assets/styles/acompanhamento.css";

const moeda = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function DetalhesPedido() {
  const { pedidoId } = useParams();

  const [mensagemCopia, setMensagemCopia] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const pedido = resultado?.id === pedidoId ? resultado : null;

  useEffect(() => {
    const controlador = new AbortController();
    let temporizador;
    async function atualizar() {
      try {
        const dados = await consultarPedido(pedidoId, { signal: controlador.signal });
        if (controlador.signal.aborted) return;
        registrarPedido(dados.id);
        setResultado(dados);
        setErro("");
        // Uma nova consulta só começa após a anterior terminar.
        if (!["CONCLUIDO", "CANCELADO"].includes(dados.status)) {
          temporizador = setTimeout(atualizar, 5000);
        }
      } catch {
        if (!controlador.signal.aborted) setErro("Não foi possível atualizar o pedido. Confira se o backend está disponível e tente novamente.");
      }
    }
    atualizar();
    return () => {
      controlador.abort();
      clearTimeout(temporizador);
    };
  }, [pedidoId, tentativa]);

  async function copiarReferencia() {
    try {
      await navigator.clipboard.writeText(pedido.id);
      setMensagemCopia("Referência copiada.");
    } catch {
      setMensagemCopia("Não foi possível copiar. Selecione a referência acima.");
    }
  }

  if (!pedido) return (
    <main className="acompanhamento app-container">
      <span className="acompanhamento__rotulo">Commande</span>
      <h1>{erro ? "Pedido indisponível" : "Carregando pedido…"}</h1>
      <p role={erro ? "alert" : "status"}>{erro || "Consultando os dados salvos no bistrô."}</p>
      {erro && <button type="button" className="acompanhamento__botao" onClick={() => { setErro(""); setTentativa(atual => atual + 1); }}>Tentar novamente</button>}
      <Link to="/pedidos" className="acompanhamento__voltar">Meus pedidos</Link>
      <Link to="/pratos" className="acompanhamento__botao">Voltar ao cardápio <ArrowRight aria-hidden="true" /></Link>
    </main>
  );

  const retirada = pedido.recebimento.tipo === "retirada";
  const endereco = pedido.recebimento.endereco;
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(pedido.criadoEm));
  const situacao = descreverStatus(pedido.status, retirada);
  // As etapas refletem o status recebido do servidor, sem avanço fictício.
  const etapas = [
    { nome: "Confirmado", Icone: CircleCheck },
    { nome: "Em preparo", Icone: ChefHat },
    { nome: retirada ? "Pronto para retirada" : "Saiu para entrega", Icone: retirada ? ShoppingBag : Truck },
    { nome: retirada ? "Retirado" : "Entregue", Icone: Check },
  ];

  return (
    <main className="acompanhamento app-container">
      <nav className="acompanhamento__navegacao" aria-label="Navegação do pedido">
        <Link to="/pratos" className="acompanhamento__voltar"><ArrowLeft aria-hidden="true" /> Voltar ao cardápio</Link>
        <Link to="/pedidos" className="acompanhamento__voltar">Meus pedidos</Link>
      </nav>
      {erro && <div role="alert" className="acompanhamento__card"><p>{erro} Exibindo a última consulta bem-sucedida.</p><button type="button" onClick={() => setTentativa(atual => atual + 1)}>Atualizar pedido</button></div>}
      <header className="acompanhamento__cabecalho">
        <div><span className="acompanhamento__rotulo">Merci beaucoup</span><h1>Acompanhe seu pedido</h1><p>Confira a confirmação e os detalhes do seu pedido.</p></div>
        <div className="acompanhamento__referencia"><span>Referência do pedido</span><div><strong>{pedido.id}</strong><button type="button" onClick={copiarReferencia} aria-label="Copiar referência do pedido"><Copy aria-hidden="true" /></button></div><small>Registrado em {data}</small><span className="acompanhamento__copia" role="status">{mensagemCopia}</span></div>
      </header>

      <section className="acompanhamento__card acompanhamento__status" aria-labelledby="status-pedido">
        <div className="acompanhamento__status-topo">
          <div className="acompanhamento__situacao"><span className="acompanhamento__icone"><CircleCheck aria-hidden="true" /></span><div><span className="acompanhamento__rotulo">Status do pedido</span><h2 id="status-pedido">{situacao.titulo}</h2><p>Dados consultados no bistrô.</p></div></div>
          <div className="acompanhamento__previsao"><Clock aria-hidden="true" /><div><span>{retirada ? "Previsão de retirada" : "Previsão de entrega"}</span><strong>Ainda não informada</strong></div></div>
        </div>
        <ol className="acompanhamento__etapas" aria-label="Etapas do pedido">{etapas.map(({ nome, Icone }, indice) => (
          <li key={nome} className={indice === situacao.indice ? "etapa--atual" : ""} aria-current={indice === situacao.indice ? "step" : undefined}><span className="acompanhamento__etapa-icone"><Icone aria-hidden="true" /></span><strong>{nome}</strong><span>{indice === situacao.indice ? "Etapa atual" : indice < situacao.indice ? "Concluída" : pedido.status === "CANCELADO" ? "Interrompida" : "Aguardando"}</span></li>
        ))}</ol>
        <p className="acompanhamento__nota">{["CONCLUIDO", "CANCELADO"].includes(pedido.status) ? "Este pedido foi encerrado." : "O andamento é consultado automaticamente a cada 5 segundos."}</p>
      </section>

      <div className="acompanhamento__colunas">
        <section className="acompanhamento__card" aria-labelledby="itens-pedido"><div className="acompanhamento__titulo"><h2 id="itens-pedido">Seu pedido</h2><span className="acompanhamento__badge">{pedido.valores.quantidadeTotal} {pedido.valores.quantidadeTotal === 1 ? "item" : "itens"}</span></div>
          <ul className="acompanhamento__itens">{pedido.itens.map(item => <li key={item.id}><img src={item.imagem} alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ratatouille.jpg"; }} /><div><strong>{item.nome}</strong><span>{item.quantidade} × {moeda(item.preco)}</span></div><strong>{moeda(item.preco * item.quantidade)}</strong></li>)}</ul>
          <dl className="acompanhamento__valores"><div><dt>Subtotal</dt><dd>{moeda(pedido.valores.subtotal)}</dd></div><div><dt>{retirada ? "Retirada no bistrô" : "Taxa de entrega"}</dt><dd>{retirada ? "Sem taxa" : moeda(pedido.valores.taxaEntrega)}</dd></div><div className="acompanhamento__total"><dt>Total do pedido</dt><dd>{moeda(pedido.valores.total)}</dd></div></dl>
          {pedido.observacoes && <div className="acompanhamento__observacoes"><h3>Observações para a cozinha</h3><p>{pedido.observacoes}</p></div>}
        </section>
        <div className="acompanhamento__lateral">
          <section className="acompanhamento__card"><h2 className="acompanhamento__titulo-icone">{retirada ? <ShoppingBag aria-hidden="true" /> : <Truck aria-hidden="true" />}{retirada ? "Retirada no bistrô" : "Dados da entrega"}</h2>
            <address className="acompanhamento__endereco"><MapPin aria-hidden="true" /><div>{retirada ? <strong>{enderecoRestaurante}</strong> : <><strong>{endereco.logradouro}, {endereco.numero}</strong><span>{endereco.bairro} · CEP {endereco.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</span>{endereco.complemento && <span>{endereco.complemento}</span>}</>}</div></address>
            <dl className="acompanhamento__cliente"><div><dt>Pedido em nome de</dt><dd>{pedido.cliente.nome}</dd></div><div><dt>Telefone / WhatsApp</dt><dd>{pedido.cliente.telefone}</dd></div>{pedido.cliente.email && <div><dt>E-mail</dt><dd>{pedido.cliente.email}</dd></div>}</dl>
          </section>
          <section className="acompanhamento__card acompanhamento__ajuda"><span className="acompanhamento__rotulo">Estamos por aqui</span><h2>Precisa de ajuda?</h2><p>Tenha a referência do pedido em mãos ao entrar em contato.</p><a className="acompanhamento__contato" href="tel:+555533330000"><Phone aria-hidden="true" /> Falar com o bistrô <ArrowRight aria-hidden="true" /></a><small>Mesmo telefone informado no rodapé.</small></section>
          <Link className="acompanhamento__novo" to="/pratos">Fazer outro pedido <ArrowRight aria-hidden="true" /></Link>
        </div>
      </div>
    </main>
  );
}
export default DetalhesPedido;
