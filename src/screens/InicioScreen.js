import React from "react";
import Brand from "../components/PagInicial";


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
.logout, .secondary-button { padding: 10px 15px; border: 1px solid #dce4dc; border-radius: 999px; color: #4e6c65; background: transparent; font-size: 12px; font-weight: 680; cursor: pointer; }
.dashboard-main { min-height: calc(100vh - 90px); display: grid; place-content: center; justify-items: center; padding: 50px 18px; }
.dashboard-card { width: min(560px,100%); padding: 43px clamp(23px,5vw,55px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; text-align: center; }
.welcome-icon { display: grid; width: 54px; height: 54px; margin: 0 auto 19px; place-items: center; border-radius: 18px; color: #b77638; background: #f8e8bd; font-size: 28px; }
.dashboard-card h1 { margin: 10px 0; font: 500 47px Georgia,serif; letter-spacing: -1px; }
.dashboard-card > .intro { max-width: 400px; margin: 0 auto 22px; }
.account { display: flex; align-items: center; gap: 11px; padding: 13px; border: 1px solid #e8ece5; border-radius: 12px; text-align: left; }
.avatar { width: 37px; height: 37px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 12px; color: #1d5e57; background: #dcece3; font-weight: 750; }
.account strong, .account small { display: block; }
.account strong { max-width: 190px; overflow: hidden; font-size: 11px; text-overflow: ellipsis; }
.account small { margin-top: 4px; color: #82918a; font-size: 10px; }
.account-type { margin-left: auto; white-space: nowrap; }
.coming-soon { display: flex; gap: 11px; margin: 15px 0 20px; padding: 13px; border-radius: 11px; color: #64766d; background: #f3f5ed; text-align: left; font-size: 11px; line-height: 1.6; }
.coming-soon > b { color: #d4a943; font-size: 18px; }
.secondary-button { border-radius: 8px; background: white; }
.secondary-button:hover { background: #f1f7f1; }
.dashboard-caption { margin: 18px 0 0; color: #82918a; font-size: 11px; }
.dashboard-caption:first-letter { color: var(--coral); }
@media (max-width: 430px) {
  .dashboard { padding: 0 15px; }
  .dashboard-card { padding: 35px 19px; }
  .account strong { max-width: 125px; }
}

`;

export default function InicioScreen({ usuario, onLogout }) {
  return (
    <>
      <style>{styles}</style>

      <div className="dashboard">
        <header className="topbar">
          <Brand href="/inicio" />
          <button className="logout" onClick={onLogout}>Sair da conta ↗</button>
        </header>
        <main className="dashboard-main">
          <section className="dashboard-card">
            <span className="welcome-icon">✿</span>
            <span className="kicker">ÁREA DO VOLUNTARIO</span>
            <h1>Olá, {usuario.nome.split(" ")[0]}<span className="coral">.</span></h1>
            <p className="intro">Seu acesso está protegido e sua sessão está ativa. Este será o seu espaço para acompanhar as próximas etapas do Migus.</p>
            <div className="account">
              <span className="avatar">{usuario.nome.charAt(0).toUpperCase()}</span>
              <span><strong>{usuario.nome}</strong><small>{usuario.email}</small></span>
              <small className="account-type">Voluntário</small>
            </div>
            <div className="coming-soon"><b>✦</b><span><strong>Estamos preparando este espaço.</strong><br />Novas funcionalidades estarão disponíveis aqui em breve.</span></div>
            <button className="secondary-button" onClick={onLogout}>Sair com segurança</button>
          </section>
          <p className="dashboard-caption">♥ Cada conexão abre novas possibilidades.</p>
        </main>
      </div>

    </>
  );
}



