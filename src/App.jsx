import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Pedido from "./pages/Pedido";
import Pratos from "./pages/Pratos";
import CarregamentoPedido from "./components/CarregamentoPedido";

// Os detalhes são carregados quando a pessoa chega a essa etapa.
const MeusPedidos = lazy(() => import("./pages/MeusPedidos"));
const DetalhesPedido = lazy(() => import("./pages/DetalhesPedido"));
import { lerPratosPedidoSalvos, salvarPratosPedido } from "./utils/pratosPedidoStorage";

function App() {
  // Uma única fonte de estado mantém cabeçalho, catálogo e checkout sincronizados.
  const [pratosPedido, setPratosPedido] = useState(lerPratosPedidoSalvos);

  useEffect(() => {
    salvarPratosPedido(pratosPedido);
  }, [pratosPedido]);

  function alterarQuantidade(prato, variacao) {
    setPratosPedido((atuais) => {
      const existente = atuais.find((item) => item.id === prato.id);
      if (!existente) return variacao > 0 ? [...atuais, { ...prato, quantidade: variacao }] : atuais;
      return atuais.map((item) => item.id === prato.id
        ? { ...item, ...prato, quantidade: item.quantidade + variacao } : item,
      ).filter((item) => item.quantidade > 0);
    });
  }

  function removerPrato(id) {
    setPratosPedido((atuais) => atuais.filter((item) => item.id !== id));
  }

  function limparCarrinho() {
    setPratosPedido([]);
  }

  return (
    <BrowserRouter>
      <Header pratosPedido={pratosPedido} onAlterarQuantidade={alterarQuantidade} onRemoverPrato={removerPrato} onLimparCarrinho={limparCarrinho} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedido" element={<Pedido pratosPedido={pratosPedido} setPratosPedido={setPratosPedido} />} />
        <Route path="/pedidos" element={<Suspense fallback={<CarregamentoPedido />}><MeusPedidos /></Suspense>} />
        <Route path="/pedido/:pedidoId" element={<Suspense fallback={<CarregamentoPedido />}><DetalhesPedido /></Suspense>} />
        <Route path="/pratos" element={<Pratos pratosPedido={pratosPedido} onAlterarQuantidade={alterarQuantidade} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
