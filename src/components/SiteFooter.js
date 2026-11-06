import React from "react";


const styles = String.raw`
.site-shell > footer { min-height: 52px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #173e3b1a; color: #87948d; font-size: 10px; }
.site-shell > footer b { margin-left: 3px; color: var(--coral); }
@media (max-width: 760px) { .site-shell > footer { min-height: 45px; } }

`;

export default function SiteFooter() {
  return (
      <>
        <style>{styles}</style>

    <footer>
      <span>© {new Date().getFullYear()} Migus</span>
      <span>Feito para aproximar pessoas <b aria-hidden="true">♥</b></span>
    </footer>

      </>
  );
}


