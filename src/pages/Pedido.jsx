import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle, MapPin, Truck, X } from "lucide-react";
import EtapaDados from "../components/DadosForm";
import EtapaEntrega from "../components/EtapaEntrega";
import HeaderPedido from "../components/HeaderPedido";
import PratoItem from "../components/PratoItem";
import { Link, useNavigate } from "react-router-dom";
import { taxaEntregaRestaurante } from "../data/restaurante";
import { calcularResumoPedido } from "../utils/calcularResumoPedido";
import "../assets/styles/pedido.css";
import "../assets/styles/finalizacao.css";
import { validarPedido } from "../utils/validarPedido";
import { montarPedido } from "../utils/montarPedido";
import { enviarPedido } from "../services/enviarPedido";
import { registrarPedido } from "../utils/historicoPedidos";
import CarregamentoPedido from "../components/CarregamentoPedido";

function moeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Pedido({ pratosPedido, setPratosPedido }) {
  const navigate = useNavigate();
  const [tipoRecebimento, setTipoRecebimento] = useState("entrega");
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [toast, setToast] = useState("");
  const [toastTipo, setToastTipo] = useState("aviso");
  const [erros, setErros] = useState({});
  const [tentouConfirmar, setTentouConfirmar] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState("ocioso");
  const formularioRef = useRef(null);
  const envioEmAndamento = useRef(false);
  const toastTimerRef = useRef(null);
  const transicaoTimerRef = useRef(null);
  const paginaAtivaRef = useRef(true);
  const bloqueado = statusEnvio === "enviando" || statusEnvio === "sucesso";
  const textoConfirmar = statusEnvio === "enviando"
    ? "Enviando pedido…"
    : statusEnvio === "sucesso"
      ? "Pedido confirmado"
      : "Confirmar pedido";
  // Valores derivados do pedido: não precisam de outro estado do React.
  const { quantidadeTotal, subtotal, taxaEntrega, total } = calcularResumoPedido(
    pratosPedido,
    tipoRecebimento,
    taxaEntregaRestaurante,
  );
  const retiradaSelecionada = tipoRecebimento === "retirada";
  const descricaoRecebimento = retiradaSelecionada
    ? "Sem taxa de entrega"
    : quantidadeTotal === 0
      ? "Adicione pratos para calcular"
      : `Taxa fixa de ${moeda(taxaEntrega)}`;

  useEffect(() => {
    paginaAtivaRef.current = true;
    return () => {
      paginaAtivaRef.current = false;
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(transicaoTimerRef.current);
    };
  }, []);

  function dispensarToast() {
    window.clearTimeout(toastTimerRef.current);
    setToast("");
  }

  function mostrarToast(mensagem, tipo = "aviso") {
    window.clearTimeout(toastTimerRef.current);
    setToastTipo(tipo);
    setToast(mensagem);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 10000);
  }

  function alterarQuantidade(id, variacao) {
    if (bloqueado) return;
    setMensagemValidacao("");
    setStatusEnvio("ocioso");
    setPratosPedido((atuais) =>
      atuais.map((prato) =>
        prato.id === id
          ? { ...prato, quantidade: Math.max(0, prato.quantidade + variacao) }
          : prato,
      ).filter((prato) => prato.quantidade > 0),
    );
  }

  function removerPrato(id) {
    if (bloqueado) return;
    setMensagemValidacao("");
    setStatusEnvio("ocioso");
    setPratosPedido((atuais) => atuais.filter((prato) => prato.id !== id));
  }

  function lerErros(formulario) {
    // Cada atributo name vira uma chave no objeto de dados.
    const dados = Object.fromEntries(new FormData(formulario));
    return validarPedido(dados);
  }

  function atualizarValidacao(evento) {
    if (bloqueado) return;
    setStatusEnvio("ocioso");
    setMensagemValidacao("");
    // Só mostra erros durante a edição depois da primeira tentativa.
    if (evento.target.name === "tipo-recebimento") {
      // Trocar o modo limpa erros de endereço da escolha anterior.
      // A edição seguinte ou o envio valida novamente o novo modo.
      const errosRestantes = Object.fromEntries(Object.entries(erros).filter(([campo]) =>
        ["nome", "telefone", "email"].includes(campo),
      ));
      setErros(errosRestantes);
      if (Object.keys(errosRestantes).length === 0) dispensarToast();
      return;
    }
    if (tentouConfirmar) {
      const novosErros = lerErros(evento.currentTarget);
      setErros(novosErros);
      if (Object.keys(novosErros).length === 0) dispensarToast();
    }
  }

  async function confirmarPedido(evento) {
    evento.preventDefault();
    // A ref bloqueia um segundo envio antes mesmo de o React atualizar a tela.
    if (envioEmAndamento.current || statusEnvio === "sucesso") return;
    const formulario = evento.currentTarget;
    const novosErros = lerErros(formulario);
    setTentouConfirmar(true);
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      setMensagemValidacao("");
      mostrarToast("Preencha ou corrija os campos destacados para continuar.");
      // O foco segue a ordem visual dos campos, inclusive no celular.
      const primeiroInvalido = Array.from(formulario.elements).find(
        (campo) => !campo.disabled && novosErros[campo.name],
      );
      // Aguarda as mensagens entrarem no layout antes de posicionar o campo.
      window.requestAnimationFrame(() => {
        if (!primeiroInvalido?.isConnected) return;
        primeiroInvalido.focus({ preventScroll: true });
        primeiroInvalido.scrollIntoView({ block: "start", behavior: "instant" });
      });
      return; // Impede continuar quando há dados inválidos.
    }

    const dados = Object.fromEntries(new FormData(formulario));
    const pedido = montarPedido(dados, pratosPedido);
    if (pedido.itens.length === 0) {
      setMensagemValidacao("");
      mostrarToast("Adicione pelo menos um prato antes de confirmar.");
      return;
    }

    dispensarToast();
    // Os dados são lidos antes de desabilitar os campos.
    envioEmAndamento.current = true;
    setStatusEnvio("enviando");
    setMensagemValidacao("Enviando pedido…");

    try {
      const resposta = await enviarPedido(pedido);
      registrarPedido(resposta.id);
      // Remove apenas as unidades enviadas, preservando itens adicionados durante o envio.
      setPratosPedido((atuais) => atuais.map((item) => ({
        ...item,
        quantidade: item.quantidade - (pratosPedido.find((enviado) => enviado.id === item.id)?.quantidade ?? 0),
      })).filter((item) => item.quantidade > 0));
      if (!paginaAtivaRef.current) return;
      setStatusEnvio("sucesso");
      setMensagemValidacao("");
      mostrarToast("Seu pedido foi enviado. Abrindo os detalhes.", "sucesso");
      // Uma transição curta dá tempo de ler o sucesso antes da próxima tela.
      transicaoTimerRef.current = window.setTimeout(() => {
        navigate(`/pedido/${encodeURIComponent(resposta.id)}`, { replace: true });
      }, 1400);
    } catch (erro) {
      if (!paginaAtivaRef.current) return;
      const mensagem = erro instanceof Error ? erro.message : "Não foi possível confirmar o pedido. Tente novamente.";
      setStatusEnvio("erro");
      setMensagemValidacao(mensagem);
      mostrarToast(mensagem, "erro");
    } finally {
      envioEmAndamento.current = false;
    }
  }

  return (
    <main className="pagina-pedido">
    <HeaderPedido />
    {toast && (
      <div className={`pedido-toast pedido-toast--${toastTipo}`} role={toastTipo === "sucesso" ? "status" : "alert"} aria-live={toastTipo === "sucesso" ? "polite" : "assertive"}>
        {toastTipo === "sucesso" ? <CircleCheck className="pedido-toast__icone" aria-hidden="true" /> : <CircleAlert className="pedido-toast__icone" aria-hidden="true" />}
        <div className="pedido-toast__texto">
          <strong>{toastTipo === "sucesso"
            ? "Pedido confirmado"
            : toastTipo === "erro" ? "Não foi possível enviar"
            : Object.keys(erros).length > 0
              ? `Revise ${Object.keys(erros).length} ${Object.keys(erros).length === 1 ? "campo" : "campos"}`
              : "Revise seu pedido"}</strong>
          <p>{toast}</p>
        </div>
        <button
          type="button"
          onClick={dispensarToast}
          aria-label="Fechar aviso"
        >
          <X aria-hidden="true" />
        </button>
      </div>
    )}
    
    {statusEnvio === "sucesso" && <CarregamentoPedido />}
    {/* noValidate permite mostrar nossas mensagens, em vez dos balões do navegador. */}
    <form
      className="pedido-conteudo"
      ref={formularioRef}
      aria-busy={statusEnvio === "enviando"}
      onSubmit={confirmarPedido}
      onChange={atualizarValidacao}
      noValidate
    >
      <fieldset className="pedido-secoes" disabled={bloqueado || quantidadeTotal === 0}>
        <div className="pedido-card prato-container">
          <div className="pedido-selecao__cabecalho">
            <div className="texto-escolha-pratos">
              <span>01 · VOTRE SÉLECTION</span>
              <h2>Pratos escolhidos</h2>
            </div>
            <Link to="/pratos" className="pedido-cardapio__alternar">+ Adicionar pratos</Link>
          </div>
          {pratosPedido.length === 0 && (
            <p className="pedido-selecao-vazia" role="status">
              Seu pedido está vazio. Clique em “Adicionar pratos” para começar.
            </p>
          )}
          {pratosPedido.map((prato) => (
            <div key={prato.id} className="pedido-selecao__linha">
              <PratoItem
                compacto
                prato={prato}
                quantidade={prato.quantidade}
                onAlterarQuantidade={alterarQuantidade}
                onRemover={removerPrato}
              />
            </div>
          ))}

        </div>

        <EtapaEntrega
          tipoRecebimento={tipoRecebimento}
          onTipoRecebimentoChange={setTipoRecebimento}
          erros={erros}
        />
        <EtapaDados erros={erros} />
      </fieldset>
      <aside className="pedido-card resumo-pedido">
        <p className="resumo-pedido__rotulo">Votre commande</p>
        <div className="resumo-pedido__cabecalho">
          <h2 className="resumo-pedido__titulo">Resumo do pedido</h2>
          <span className="resumo-pedido__contador">
            {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}
          </span>
        </div>
        <ul className="resumo-pedido__itens">
          {pratosPedido.length === 0 && (
            <li className="resumo-pedido__vazio">Nenhum prato selecionado.</li>
          )}
          {pratosPedido.map((prato) => (
            <li className="resumo-pedido__item" key={prato.id}>
              <div className="resumo-pedido__produto">
                <div className="resumo-pedido__imagem-wrap">
                  <img
                    src={prato.imagem}
                    alt=""
                    onError={(evento) => {
                      evento.currentTarget.onerror = null;
                      evento.currentTarget.src = "/ratatouille.jpg";
                    }}
                  />
                  <span>{prato.quantidade}</span>
                </div>
                <div className="resumo-pedido__descricao">
                  <strong>{prato.nome}</strong>
                  <span>{moeda(prato.preco)} cada</span>
                </div>
              </div>
              <strong>{moeda(prato.preco * prato.quantidade)}</strong>
            </li>
          ))}
        </ul>
        <div className="resumo-pedido__entrega">
          {retiradaSelecionada ? <MapPin aria-hidden="true" /> : <Truck aria-hidden="true" />}
          <strong>{retiradaSelecionada ? "Retirada no bistrô" : "Entrega"}</strong>
          <span>{descricaoRecebimento}</span>
        </div>
        <div className="resumo-pedido__valores">
          <p><span>Subtotal</span><span>{moeda(subtotal)}</span></p>
          <p><span>Taxa de entrega</span><span>{moeda(taxaEntrega)}</span></p>
        </div>
        <div className="resumo-pedido__total">
          <strong>Total</strong>
          <strong>{moeda(total)}</strong>
        </div>
        <button className="resumo-pedido__botao" type="submit" disabled={bloqueado || quantidadeTotal === 0}>
          <span>{textoConfirmar}</span>{statusEnvio === "enviando" && <LoaderCircle className="pedido-carregamento__icone pedido-carregamento__icone--botao" aria-hidden="true" />}
          <span className="resumo-pedido__seta"><ArrowRight aria-hidden="true" /></span>
        </button>
        <div className="resumo-pedido__mobile">
          <div>
            <span>Total · {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}</span>
            <strong>{moeda(total)}</strong>
          </div>
          <button className="resumo-pedido__botao" type="submit" disabled={bloqueado || quantidadeTotal === 0}>
            <span>{statusEnvio === "ocioso" || statusEnvio === "erro" ? "Confirmar" : textoConfirmar}</span>{statusEnvio === "enviando" && <LoaderCircle className="pedido-carregamento__icone pedido-carregamento__icone--botao" aria-hidden="true" />}
            <span className="resumo-pedido__seta"><ArrowRight aria-hidden="true" /></span>
          </button>
        </div>
        {quantidadeTotal === 0 && <p className="resumo-pedido__vazio">Escolha ao menos um prato para confirmar.</p>}
        <p className="resumo-pedido__mensagem" role="status" aria-live="polite">
          {mensagemValidacao}
        </p>

      </aside>
    </form>
    </main>
  );
}

export default Pedido;
