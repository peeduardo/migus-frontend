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

function getInitialPath() {
  const path = window.location.pathname;
  return ["/cadastro", "/inicio", "/perfil"].includes(path) ? path : "/login";
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
    if ((path === "/inicio" || path === "/perfil") && !session) navigate("/login");
  }, [path, session, navigate]);

  function onLogout() {
    logout();
    navigate("/login");
  }

  if (path === "/perfil") {
    return session
      ? (
        <div className="dashboard">
          <VisualizarCadastroScreen onVoltar={() => navigate("/inicio")} />
        </div>
      )
      : null;
  }

  if (path === "/inicio") {
    return session
      ? <InicioScreen usuario={session.usuario} onLogout={onLogout} onVerCadastro={() => navigate("/perfil")} />
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
