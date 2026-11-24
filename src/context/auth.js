import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { entrar, obterSessao, sair } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(obterSessao);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session) return undefined;

    const timer = window.setTimeout(() => {
      sair();
      setSession(null);
    }, Math.max(0, session.expiresAt - Date.now()));

    return () => window.clearTimeout(timer);
  }, [session]);

  async function login(email, senha) {
    const usuario = await entrar(email, senha);
    setSession(obterSessao());
    setMessage("");
    return usuario;
  }

  function cadastroConcluido() {
    setMessage("Cadastro criado! Entre com seu e-mail e sua senha.");
  }

  function logout(mensagem = "") {
    sair();
    setSession(null);
    setMessage(mensagem);
  }

  function atualizarUsuarioSessao(novoUsuario) {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, usuario: { ...prev.usuario, ...novoUsuario } };
      sessionStorage.setItem("migus.usuario", JSON.stringify(updated.usuario));
      return updated;
    });
  }

  const value = useMemo(() => ({
    session,
    message,
    login,
    cadastroConcluido,
    logout,
    atualizarUsuarioSessao,
  }), [session, message]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return context;
}


