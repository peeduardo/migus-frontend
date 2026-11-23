import React from "react";


const styles = String.raw`
.site-shell > footer { min-height: 52px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #173e3b1a; color: #4f6159; font-size: 12px; }
.site-shell > footer b { margin-left: 3px; color: var(--coral); }
.footer-privacidade { color: #4f6159; font-size: 12px; text-decoration: underline; text-underline-offset: 2px; }
.footer-privacidade:hover { color: var(--teal); }
@media (max-width: 760px) { .site-shell > footer { min-height: 45px; } }

`;

export default function SiteFooter() {
  return (
      <>
        <style>{styles}</style>

    <footer>
      <span>
        © {new Date().getFullYear()} Migus
        {" · "}
        <a
          href="/politica-e-termos.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-privacidade"
        >
          Política de privacidade
        </a>
      </span>
      <span>Feito para aproximar pessoas <b aria-hidden="true">♥</b></span>
    </footer>

      </>
  );
}


