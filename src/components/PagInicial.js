import React from "react";


const styles = String.raw`
.brand { display: inline-flex; align-items: center; gap: 9px; color: var(--ink); font-size: 25px; font-weight: 760; letter-spacing: -1.4px; text-decoration: none; }
.coral { color: var(--coral); }
.brand-symbol { width: 30px; height: 30px; position: relative; display: inline-block; }
.brand-symbol i { position: absolute; width: 13px; height: 13px; border-radius: 50%; }
.brand-symbol i:nth-child(1) { left: 2px; top: 2px; background: #ef8062; }
.brand-symbol i:nth-child(2) { right: 2px; top: 2px; background: #f0c965; }
.brand-symbol i:nth-child(3) { left: 9px; bottom: 1px; background: #4e9c8a; }
@media (max-width: 430px) { .brand { font-size: 22px; } }

`;

export default function Brand({ onClick, href = "/login" }) {
  return (
    <>
      <style>{styles}</style>

      <a
        className="brand"
        href={href}
        aria-label="Migus, página inicial"
        onClick={(event) => {
          if (!onClick) return;
          event.preventDefault();
          onClick();
        }}
      >
        <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
        <span>Migus<span className="coral">.</span></span>
      </a>

    </>
  );
}


