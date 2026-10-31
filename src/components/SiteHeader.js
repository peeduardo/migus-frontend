import React from "react";
import Brand from "./PagInicial";


const styles = String.raw`
.topbar { min-height: 88px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(23,62,59,.1); }
.topbar nav { display: flex; align-items: center; gap: 19px; color: var(--soft); font-size: 12px; }
.topbar nav a { color: inherit; text-decoration: none; }
.topbar nav a:hover { color: var(--teal); }
.nav-divider { width: 1px; height: 20px; background: #d7ddd5; }
.nav-button { padding: 11px 17px; border: 0; border-radius: 30px; color: white; background: var(--teal); font-size: 12px; font-weight: 700; cursor: pointer; }
.nav-button:hover { background: #1d5e57; }
@media (max-width: 760px) {
  .topbar { min-height: 72px; }
  .topbar nav { gap: 12px; }
  .about-link, .nav-divider, .nav-question { display: none; }
}
@media (max-width: 430px) { .topbar { min-height: 65px; } }

`;

export default function SiteHeader({ page, navigate }) {
  const isCadastro = page === "/cadastro";
  const destination = isCadastro ? "/login" : "/cadastro";

  return (
    <>
      <style>{styles}</style>

      <header className="topbar">
        <Brand onClick={() => navigate("/login")} />
        <nav aria-label="Navegação principal">
          <a className="about-link" href="https://friendshipcircle.com.br" target="_blank" rel="noreferrer">
            Conheça o projeto ↗
          </a>
          <span className="nav-divider" />
          <span className="nav-question">{isCadastro ? "Já faz parte?" : "Primeira vez por aqui?"}</span>
          <button className="nav-button" onClick={() => navigate(destination)}>
            {isCadastro ? "Entrar" : "Criar conta"}
          </button>
        </nav>
      </header>

    </>
  );
}


