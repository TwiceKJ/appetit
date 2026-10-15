import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Clock, CheckCircle2, Truck } from "lucide-react";
import { lerReferenciasPedidos } from "../utils/historicoPedidos";
import { consultarPedido } from "../services/enviarPedido";
import { descreverStatus } from "../utils/statusPedido";
import "../assets/styles/acompanhamento.css";

const moeda = valor => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MeusPedidos() {
  const [ids] = useState(lerReferenciasPedidos);
  const [resultados, setResultados] = useState({});
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    // Cada cartão resolve separadamente: uma falha não esconde os outros pedidos.
    ids.forEach(async id => {
      try {
        const pedido = await consultarPedido(id, { signal: controlador.signal });
        if (!controlador.signal.aborted) setResultados(atuais => ({ ...atuais, [id]: { pedido } }));
      } catch {
        if (!controlador.signal.aborted) setResultados(atuais => ({ ...atuais, [id]: { erro: true } }));
      }
    });
    return () => controlador.abort();
  }, [ids, tentativa]);

  return (
    <main className="acompanhamento app-container">
      <span className="acompanhamento__rotulo">Vos commandes</span>
      <h1>Meus pedidos</h1>
      <p>Pedidos confirmados neste navegador. Abra um pedido para acompanhar o andamento.</p>
      {ids.length === 0 ? <section className="acompanhamento__card meus-pedidos__vazio">
        <ShoppingBag aria-hidden="true" /><h2>Você ainda não tem pedidos salvos aqui</h2>
        <p>Ao confirmar um pedido, ele aparecerá nesta página. Pedidos de demonstração não são registrados no bistrô.</p>
        <Link to="/pratos" className="acompanhamento__botao">Conhecer o cardápio <ArrowRight aria-hidden="true" /></Link>
      </section> : <>
        <button type="button" className="acompanhamento__botao" onClick={() => setTentativa(atual => atual + 1)}>Atualizar pedidos</button>
        <ul className="meus-pedidos__lista">{ids.map(id => {
          const resultado = resultados[id];
          const pedido = resultado?.pedido;
          const retirada = pedido?.recebimento.tipo === "retirada";
          const titulo = pedido ? descreverStatus(pedido.status, retirada).titulo : resultado?.erro ? "Consulta indisponível" : "Consultando pedido…";
          return <li key={id} className="meu-pedido">
            <div className="meu-pedido__topo">
              <span className={`meu-pedido__status${pedido?.status === "CANCELADO" ? " meu-pedido__status--cancelado" : ""}`}><CheckCircle2 aria-hidden="true" />{titulo}</span>
              <span className="meu-pedido__codigo" title={id}>#{id.slice(0, 8).toUpperCase()}</span>
            </div>
            {pedido ? <>
              <div className="meu-pedido__resumo">
                {/* A imagem é decorativa: o nome do prato aparece ao lado. */}
                <img src={pedido.itens[0]?.imagem || "/ratatouille.jpg"} alt="" onError={evento => { evento.currentTarget.onerror = null; evento.currentTarget.src = "/ratatouille.jpg"; }} />
                <div><h2>{pedido.itens[0]?.nome || "Seu pedido"}</h2>
                  <p>{pedido.valores.quantidadeTotal} {pedido.valores.quantidadeTotal === 1 ? "item" : "itens"}{pedido.itens.length > 1 ? ` · +${pedido.itens.length - 1} ${pedido.itens.length === 2 ? "prato" : "pratos"}` : ""}</p>
                </div>
              </div>
              <div className="meu-pedido__metadados">
                <span><Clock aria-hidden="true" /><time dateTime={pedido.criadoEm}>{new Date(pedido.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></span>
                <span>{retirada ? <ShoppingBag aria-hidden="true" /> : <Truck aria-hidden="true" />}{retirada ? "Retirada no bistrô" : "Entrega"}</span>
              </div>
            </> : <p className="meu-pedido__aviso" role={resultado?.erro ? "alert" : "status"}>{resultado?.erro ? "Não foi possível consultar este pedido. Tente abrir os detalhes novamente." : "Buscando os detalhes no bistrô…"}</p>}
            <div className="meu-pedido__rodape">
              {pedido && <div className="meu-pedido__total"><span>Total do pedido</span><strong>{moeda(pedido.valores.total)}</strong></div>}
              <Link to={`/pedido/${encodeURIComponent(id)}`} className="meu-pedido__abrir" aria-label={`Acompanhar pedido ${id.slice(0, 8)}`}>Acompanhar <ArrowRight aria-hidden="true" /></Link>
            </div>
          </li>;
        })}</ul>
      </>}
    </main>
  );
}
