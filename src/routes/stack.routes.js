import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import AuthLayout from "../components/AuthLayout";
import SiteFooter from "../components/SiteFooter";
import SkipLink from "../components/SkipLink";
import SiteHeader from "../components/SiteHeader";
import WelcomePanel from "../components/Welcome";
import CadastroScreen from "../screens/CadastroScreen";
import InicioScreen from "../screens/InicioScreen";
import LoginScreen from "../screens/LoginScreen";
import VisualizarCadastroScreen from "../screens/VisualizarCadastroScreen";
import ProgramaScreen from "../screens/ProgramaScreen";
import ProgramasAtivosScreen from "../screens/ProgramasAtivosScreen";
import InscritosScreen from "../screens/InscritosScreen";
import MinhasInscricoesScreen from "../screens/MinhasInscricoesScreen";
import HistoricoParticipacaoScreen from "../screens/HistoricoParticipacaoScreen";
import MeusProgramasScreen from "../screens/MeusProgramasScreen";
import ExVoluntariosScreen from "../screens/ExVoluntariosScreen";

const rotasProtegidas = ["/minhas-inscricoes", "/historico-participacao", "/inicio", "/perfil", "/programas", "/programas/cadastro", "/programas/inscritos", "/programas/meus", "/ex-voluntarios"];

function getInitialPath() {
  const path = window.location.pathname;
  return ["/cadastro", ...rotasProtegidas].includes(path) ? path : "/login";
}

export default function StackRoutes() {
  const [path, setPath] = useState(getInitialPath);
  const { session, message, login, cadastroConcluido, logout } = useAuth();

  const navigate = useCallback((destination) => {
    window.history.pushState({}, "", destination);
    setPath(destination);
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(getInitialPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (rotasProtegidas.includes(path) && !session) navigate("/login");
  }, [path, session, navigate]);

  function onLogout() {
    logout();
    navigate("/login");
  }

  if (path === "/perfil") {
    return session
      ? (
        <VisualizarCadastroScreen
          onVoltar={() => navigate("/inicio")}
          onLogout={onLogout}
          onContaDesativada={() => {
            logout("Conta desativada com sucesso.");
            navigate("/login");
          }}
        />
      )
      : null;
  }

  if (path === "/inicio") {
    return session
? <InicioScreen usuario={session.usuario} onLogout={onLogout} onVerCadastro={() => navigate("/perfil")} onCadastrarPrograma={() => navigate("/programas/cadastro")} onVerProgramas={() => navigate("/programas")} onVerInscritos={() => navigate("/programas/inscritos")} onVerMeusProgramas={() => navigate("/programas/meus")} onMinhasInscricoes={() => navigate("/minhas-inscricoes")} onVerExVoluntarios={() => navigate("/ex-voluntarios")} onHistoricoParticipacao={() => navigate("/historico-participacao")}/>      : null;
  }

  if (path === "/programas/inscritos") {
    return session
      ? <InscritosScreen key={session.usuario.id} usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/ex-voluntarios") {
    return session
      ? <ExVoluntariosScreen key={session.usuario.id} usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/minhas-inscricoes") {
    return session
      ? <MinhasInscricoesScreen key={session.usuario.id} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/historico-participacao") {
    return session
      ? <HistoricoParticipacaoScreen key={session.usuario.id} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/programas/meus") {
  return session
    ? <MeusProgramasScreen
        key={session.usuario.id}
        usuario={session.usuario}
        onInicio={() => navigate("/inicio")}
      />
    : null;
  }
  
  if (path === "/programas") {
    return session
      ? <ProgramasAtivosScreen key={session.usuario.id} usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/programas/cadastro") {
    return session
      ? <ProgramaScreen key={session.usuario.id} usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  return (
    <div className="site-shell">
      <SkipLink /><SiteHeader page={path} navigate={navigate} />
      <main id="conteudo" tabIndex={-1} className="auth-layout">
        <WelcomePanel />
        <AuthLayout>
          {path === "/cadastro"
            ? <CadastroScreen onCreated={() => {
              cadastroConcluido();
              navigate("/login");
            }} onLogin={() => navigate("/login")} />
            : <LoginScreen successMessage={message} onLogin={async (email, senha) => {
              await login(email, senha);
              navigate("/inicio");
            }} onRegister={() => navigate("/cadastro")} />}
        </AuthLayout>
      </main>
      <SiteFooter />
    </div>
  );
}
