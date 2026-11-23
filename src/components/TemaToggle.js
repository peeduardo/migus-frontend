import React from "react";
import { useTheme } from "../context/theme";

const styles = String.raw`
.tema-toggle { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border: 1px solid var(--border-ui); border-radius: 50%; color: var(--soft); background: transparent; cursor: pointer; transition: background .15s, color .15s, border-color .15s; flex-shrink: 0; }
.tema-toggle:hover { background: rgba(38,118,109,.12); border-color: var(--teal); color: var(--teal); }
.tema-toggle svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
`;

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22"  x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function TemaToggle() {
  const { tema, alternar } = useTheme();
  const escuro = tema === "escuro";

  return (
    <>
      <style>{styles}</style>
      <button
        type="button"
        className="tema-toggle"
        onClick={alternar}
        aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
        title={escuro ? "Tema claro" : "Tema escuro"}
      >
        {escuro ? <SunIcon /> : <MoonIcon />}
      </button>
    </>
  );
}
