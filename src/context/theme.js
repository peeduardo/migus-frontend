import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "migus-tema";

function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "escuro" || saved === "claro") return saved;
  // Respeita a preferência do SO se não houver escolha salva
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "escuro";
  }
  return "claro";
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  const alternar = useCallback(() => {
    setTema(atual => (atual === "escuro" ? "claro" : "escuro"));
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, alternar }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de ThemeProvider");
  return ctx;
}
