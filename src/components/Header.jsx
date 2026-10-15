import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Rat, Menu, X } from 'lucide-react'
import CarrinhoPopover from './CarrinhoPopover'

const links = [
  { texto: 'Início', caminho: '/', end: true },
  { texto: 'Pratos', caminho: '/pratos' },
  { texto: 'Meus pedidos', caminho: '/pedidos' },
]

const estiloLink = ({ isActive }) =>
  'hover:text-white hover:-translate-y-1 transition duration-300 ease-out motion-reduce:transition-none ' +
  (isActive ? 'underline decoration-terracota decoration-4 underline-offset-8' : '')

function Header({ pratosPedido, onAlterarQuantidade, onRemoverPrato, onLimparCarrinho }) {
  const headerRef = useRef(null)
  const [aberto, setAberto] = useState(false)
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  // Callback estável evita reinstalar os eventos do popover a cada quantidade alterada.
  const fecharCarrinho = useCallback(() => setCarrinhoAberto(false), [])

  useEffect(() => {
    // Mede o cabeçalho real, inclusive quando o menu mobile altera sua altura.
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--altura-cabecalho', `${headerRef.current.getBoundingClientRect().height}px`)
    })
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  function fecharNavegacao() {
    setAberto(false)
    fecharCarrinho()
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-marrom-escuro text-bege-areia">
      <div className="app-container site-header__inner">
        <Link to="/" onClick={fecharNavegacao} className="group flex flex-col items-center font-titulo text-3xl font-bold uppercase tracking-wide leading-none">
          <Rat aria-hidden="true" className="size-6 transition duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none" />
          <span>Appetit<span className="text-terracota" aria-hidden="true">.</span></span>
        </Link>
        <div className="site-header__acoes">
          <nav aria-label="Principal" className="hidden md:flex gap-10 font-titulo text-lg uppercase tracking-widest">
            {links.map((link) => (
              <NavLink key={link.caminho} to={link.caminho} end={link.end} className={estiloLink} onClick={fecharNavegacao}>{link.texto}</NavLink>
            ))}
          </nav>
          <CarrinhoPopover pratos={pratosPedido} aberto={carrinhoAberto}
            onAbrir={() => { setAberto(false); setCarrinhoAberto(true) }} onFechar={fecharCarrinho}
            onAlterarQuantidade={onAlterarQuantidade} onRemoverPrato={onRemoverPrato}
            onLimparCarrinho={onLimparCarrinho} />
          <button type="button" onClick={() => { fecharCarrinho(); setAberto(!aberto) }}
            aria-expanded={aberto} aria-controls="menu-mobile" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            className="md:hidden p-2 rounded-full hover:bg-white/10">
            {aberto ? <X className="size-7" aria-hidden="true" /> : <Menu className="size-7" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {aberto && (
        <nav id="menu-mobile" aria-label="Menu" className="app-container md:hidden flex flex-col gap-5 pb-6 font-titulo text-xl uppercase tracking-widest">
          {links.map((link) => (
            <NavLink key={link.caminho} to={link.caminho} end={link.end} className={estiloLink} onClick={fecharNavegacao}>{link.texto}</NavLink>
          ))}
        </nav>
      )}
      <div className="toldo h-4 border-b-4 border-marrom-escuro" aria-hidden="true" />
    </header>
  )
}

export default Header
