import { useEffect, useRef } from "react";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calcularResumoPedido } from "../utils/calcularResumoPedido";
import "../assets/styles/carrinho.css";

const moeda = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CarrinhoPopover({ pratos, aberto, onAbrir, onFechar, onAlterarQuantidade, onRemoverPrato, onLimparCarrinho }) {
  const grupoRef = useRef(null);
  const botaoRef = useRef(null);
  const fecharRef = useRef(null);
  const navigate = useNavigate();
  const { quantidadeTotal, subtotal } = calcularResumoPedido(pratos, "retirada", 0);

  function fecharComFoco() {
    onFechar();
    botaoRef.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    fecharRef.current?.focus();
    // O popover não bloqueia a página: clique fora e Escape apenas o fecham.
    function clicarFora(evento) {
      if (!grupoRef.current?.contains(evento.target)) onFechar();
    }
    function teclado(evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onFechar();
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", clicarFora);
    document.addEventListener("keydown", teclado);
    return () => {
      document.removeEventListener("pointerdown", clicarFora);
      document.removeEventListener("keydown", teclado);
    };
  }, [aberto, onFechar]);

  return (
    <div className="carrinho-ancora" ref={grupoRef} onBlur={(evento) => {
      if (evento.relatedTarget && !evento.currentTarget.contains(evento.relatedTarget)) onFechar();
    }}>
      <button ref={botaoRef} className="carrinho-gatilho" type="button"
        onClick={aberto ? fecharComFoco : onAbrir} aria-expanded={aberto}
        aria-haspopup="dialog" aria-controls={aberto ? "carrinho-painel" : undefined}>
        <ShoppingCart aria-hidden="true" /><span>Carrinho</span>
        {/* Só aparece com itens; a key reinicia a animação a cada mudança de quantidade. */}
        {quantidadeTotal > 0 && (
          <span key={quantidadeTotal} className="carrinho-contador" aria-label={`${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}`}>{quantidadeTotal}</span>
        )}
      </button>
      {aberto && (
        <section id="carrinho-painel" className="carrinho-painel" role="dialog" aria-modal="false" aria-labelledby="carrinho-titulo">
          <div className="carrinho-cabecalho">
            <h2 id="carrinho-titulo">Seu carrinho</h2>
            <span className="carrinho-selo">{quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}</span>
            <button ref={fecharRef} className="carrinho-icone" type="button" aria-label="Fechar carrinho" onClick={fecharComFoco}><X aria-hidden="true" /></button>
          </div>
          <div className="carrinho-conteudo">
            {pratos.length === 0 ? <p className="carrinho-vazio" role="status">Seu carrinho está vazio. Escolha um prato no cardápio.</p> : (
              <ul className="carrinho-itens">
                {pratos.map((prato) => (
                  <li className="carrinho-item" key={prato.id}>
                    <img src={prato.imagem} alt="" />
                    <div className="carrinho-produto">
                      <strong>{prato.nome}</strong><span>{moeda(prato.preco)} cada</span>
                      <div className="carrinho-controles">
                        <div className="carrinho-quantidade" role="group" aria-label={`Quantidade de ${prato.nome}`}>
                          <button type="button" aria-label={`Remover uma unidade de ${prato.nome}`} onClick={() => onAlterarQuantidade(prato, -1)}><Minus aria-hidden="true" /></button>
                          <span aria-live="polite">{prato.quantidade}</span>
                          <button type="button" aria-label={`Adicionar mais uma unidade de ${prato.nome}`} onClick={() => onAlterarQuantidade(prato, 1)}><Plus aria-hidden="true" /></button>
                        </div>
                        <strong>{moeda(prato.preco * prato.quantidade)}</strong>
                      </div>
                    </div>
                    <button className="carrinho-icone" type="button" aria-label={`Remover ${prato.nome} do carrinho`} onClick={() => onRemoverPrato(prato.id)}><Trash2 aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="carrinho-rodape">
            <div className="carrinho-subtotal"><strong>Subtotal</strong><strong>{moeda(subtotal)}</strong></div>
            <button className="carrinho-limpar" type="button" disabled={pratos.length === 0} onClick={onLimparCarrinho}>
              <Trash2 aria-hidden="true" /> Limpar carrinho
            </button>
            <p>Entrega calculada na próxima etapa.</p>
            <button className="carrinho-finalizar" type="button" onClick={() => { onFechar(); navigate("/pedido"); }}>Finalizar pedido <ArrowRight aria-hidden="true" /></button>
            <button className="carrinho-continuar" type="button" onClick={fecharComFoco}>Continuar escolhendo</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default CarrinhoPopover;
