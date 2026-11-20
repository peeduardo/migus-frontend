import React from "react";
import Brand from "../components/PagInicial";
import SkipLink from "../components/SkipLink";
import NotificacaoInscricoes from "../components/NotificacaoInscricoes";
import TemaToggle from "../components/TemaToggle";


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

.dashboard { min-height: 100vh; padding: 0 7%; background: var(--cream); }
.dashboard > .topbar { max-width: 1260px; margin: auto; }
.topbar-actions { display: flex; align-items: center; gap: 10px; }
.nav-profile-btn { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 8px; border: 1px solid var(--border-ui); border-radius: 999px; color: #173e3b; background: white; font-size: 12px; font-weight: 680; cursor: pointer; transition: all .15s ease; }
.nav-profile-btn:hover { background: #f3f5ed; border-color: #c4d0c5; }
.nav-avatar { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; color: #1d5e57; background: #dcece3; font-size: 11px; font-weight: 750; }
.logout { padding: 10px 15px; border: 1px solid var(--border-ui); border-radius: 999px; color: #4e6c65; background: transparent; font-size: 12px; font-weight: 680; cursor: pointer; transition: all .15s ease; }
.logout:hover { background: #f3f5ed; color: #173e3b; }
.dashboard-main { min-height: calc(100vh - 90px); display: grid; place-content: center; grid-template-columns: minmax(0, 560px); justify-items: center; padding: 50px 18px; }
.dashboard-card { width: min(560px,100%); padding: 43px clamp(23px,5vw,55px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; text-align: center; }
.welcome-icon { display: grid; width: 54px; height: 54px; margin: 0 auto 19px; place-items: center; border-radius: 18px; color: #b77638; background: #f8e8bd; font-size: 28px; }
.dashboard-card h1 { margin: 10px 0; font: 500 clamp(32px, 7vw, 47px) Georgia,serif; overflow-wrap: anywhere; letter-spacing: -1px; }
.dashboard-card > .intro { max-width: 400px; margin: 0 auto 22px; }
.account { display: flex; align-items: center; gap: 11px; padding: 13px; border: 1px solid #e8ece5; border-radius: 12px; text-align: left; }
.avatar { width: 37px; height: 37px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 12px; color: #1d5e57; background: #dcece3; font-weight: 750; }
.account strong, .account small { display: block; }
.account .account-details { min-width: 0; overflow-wrap: anywhere; }
.account strong { font-size: 11px; }
.account small { margin-top: 4px; color: #4f6159; font-size: 12px; }
.account-type { margin-left: auto; white-space: nowrap; }
.coming-soon { display: flex; gap: 11px; margin: 15px 0 20px; padding: 13px; border-radius: 11px; color: #4f6159; background: #f3f5ed; text-align: left; font-size: 11px; line-height: 1.6; }
.coming-soon > b { color: #d4a943; font-size: 18px; }
.dashboard-actions, .programa-acesso { display: flex; flex-direction: column; gap: 10px; width: 100%; margin-top: 20px; }
.secondary-button { width: 100%; min-height: 44px; padding: 12px 16px; border: 1px solid var(--border-ui); border-radius: 10px; color: #173e3b; background: white; font-size: 13px; font-weight: 680; cursor: pointer; transition: all .15s ease; display: flex; align-items: center; justify-content: center; text-align: center; }
.secondary-button:hover { background: #f1f7f1; border-color: #5c9f91; color: var(--teal); }
.dashboard-caption { margin: 18px 0 0; color: #4f6159; font-size: 11px; }
.dashboard-caption:first-letter { color: var(--coral); }
@media (max-width: 430px) {
  .dashboard { padding: 0 15px; }
  .dashboard-card { padding: 35px 19px; }
}

`;

export default function InicioScreen({ usuario, onLogout, onVerCadastro, onCadastrarPrograma, onVerProgramas, onVerInscritos, onVerMeusProgramas, onMinhasInscricoes, onVerExVoluntarios }) {
  const responsavel = usuario.tipoUsuario === "RESPONSAVEL";
  const nomesPerfis = { RESPONSAVEL: "Responsável", interessado: "Interessado", VOLUNTARIO: "Voluntário" };
  const perfil = nomesPerfis[usuario.tipoUsuario] || usuario.tipoUsuario || "Perfil não informado";
  const titulo = nomesPerfis[usuario.tipoUsuario] ? "Área do " + perfil.toLowerCase() : "Área da conta";
  return (
    <>
      <style>{styles}</style>

      <div className="dashboard">
        <SkipLink /><header className="topbar">
          <Brand href="/inicio" />
          <div className="topbar-actions">
            {responsavel && usuario.ativo === true && <NotificacaoInscricoes />}
            <TemaToggle />
            <button type="button" className="nav-profile-btn" onClick={onVerCadastro}>
              <span className="nav-avatar" aria-hidden="true">{usuario.nome.charAt(0).toUpperCase()}</span>
              <span>Meu perfil</span>
            </button>
            <button type="button" className="logout" onClick={onLogout}>Sair da conta</button>
          </div>
        </header>
        <main id="conteudo" tabIndex={-1} className="dashboard-main">
          <section className="dashboard-card">
            <span className="welcome-icon" aria-hidden="true">✿</span>
            <span className="kicker">{titulo}</span>
            <h1>Olá, {usuario.nome.split(" ")[0]}<span className="coral">.</span></h1>
            <p className="intro">Você está conectado. Aqui você vai acompanhar o que acontece no Migus.</p>
            <div className="account">
              <span className="avatar" aria-hidden="true">{usuario.nome.charAt(0).toUpperCase()}</span>
              <span className="account-details"><strong>{usuario.nome}</strong><small>{usuario.email}</small></span>
              <small className="account-type">{perfil}</small>
            </div>
            {responsavel && usuario.ativo === true ? (
              <div className="dashboard-actions programa-acesso">
                <button type="button" className="secondary-button" onClick={onCadastrarPrograma}>Cadastrar programa</button>
                <button type="button" className="secondary-button" onClick={onVerInscritos}>Ver inscritos</button>
                <button type="button" className="secondary-button" onClick={onVerMeusProgramas}>Meus programas</button>
                <button type="button" className="secondary-button" onClick={onVerExVoluntarios}>Ex-voluntários</button>
                <button type="button" className="secondary-button" onClick={onMinhasInscricoes}>Minhas inscrições</button>
                <button type="button" className="secondary-button" onClick={onVerCadastro}>Ver meu cadastro →</button>
              </div>
            ) : (
              <>
                <div className="coming-soon"><b>✦</b><span><strong>Estamos preparando este espaço.</strong><br />Em breve, teremos mais novidades aqui.</span></div>
                <div className="dashboard-actions">
                  <button type="button" className="secondary-button" onClick={onVerProgramas}>Ver programas ativos →</button>
                  <button type="button" className="secondary-button" onClick={onMinhasInscricoes}>Minhas inscrições</button>
                  <button type="button" className="secondary-button" onClick={onVerCadastro}>Ver meu cadastro →</button>
                </div>
              </>
            )}
          </section>
          <p className="dashboard-caption"><span aria-hidden="true">♥</span> Cada conexão abre novas possibilidades.</p>
        </main>
      </div>

    </>
  );
}



