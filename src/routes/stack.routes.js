import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import AuthLayout from "../components/AuthLayout";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import WelcomePanel from "../components/Welcome";
import CadastroScreen from "../screens/CadastroScreen";
import InicioScreen from "../screens/InicioScreen";
import LoginScreen from "../screens/LoginScreen";
import VisualizarCadastroScreen from "../screens/VisualizarCadastroScreen";
import ProgramaScreen from "../screens/ProgramaScreen";
import ProgramasAtivosScreen from "../screens/ProgramasAtivosScreen";
import InscritosScreen from "../screens/InscritosScreen";
import MeusProgramasScreen from "../screens/MeusProgramasScreen";

const rotasProtegidas = ["/inicio", "/perfil", "/programas", "/programas/cadastro", "/programas/inscritos", "/programas/meus"];

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
        />
      )
      : null;
  }

  if (path === "/inicio") {
    return session
      ? <InicioScreen usuario={session.usuario} onLogout={onLogout} onVerCadastro={() => navigate("/perfil")} onCadastrarPrograma={() => navigate("/programas/cadastro")} onVerProgramas={() => navigate("/programas")} onVerInscritos={() => navigate("/programas/inscritos")} onVerMeusProgramas={() => navigate("/programas/meus")}/>
      : null;
  }

  if (path === "/programas/inscritos") {
    return session
      ? <InscritosScreen key={session.usuario.id} usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/programas/meus") {
  return session
    ? <MeusProgramasScreen
        usuario={session.usuario}
        onInicio={() => navigate("/inicio")}
      />
    : null;
  }
  
  if (path === "/programas") {
    return session
      ? <ProgramasAtivosScreen usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  if (path === "/programas/cadastro") {
    return session
      ? <ProgramaScreen key={session.usuario.id} usuario={session.usuario} onInicio={() => navigate("/inicio")} />
      : null;
  }

  return (
    <div className="site-shell">
      <SiteHeader page={path} navigate={navigate} />
      <main className="auth-layout">
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
