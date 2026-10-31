import React from "react";


const styles = String.raw`
.form-panel { align-self: center; justify-self: center; width: 100%; max-width: 480px; padding: 38px clamp(26px,4vw,46px) 27px; border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; }
.mobile-brand { display: none; }
.privacy { margin: 22px 0 0; padding-top: 16px; border-top: 1px solid #eef0e9; color: #9aa49e; font-size: 10px; text-align: center; }
.privacy span { margin-right: 5px; color: var(--teal); font-size: 14px; }
@media (max-width: 760px) {
  .form-panel { max-width: 490px; margin: 0 auto; padding: 26px clamp(22px,7vw,40px) 22px; }
  .mobile-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 23px; font-size: 20px; font-weight: 750; }
  .mobile-brand .brand-symbol { transform: scale(.85); transform-origin: left center; margin-right: -4px; }
}
@media (max-width: 430px) { .form-panel { padding: 22px 18px 19px; border-radius: 18px; } }

`;

export default function AuthLayout({ children }) {
  return (
    <>
      <style>{styles}</style>

      <section className="form-panel" aria-label="Acesso ao Migus">
        <div className="mobile-brand">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
          <span>Migus<span className="coral">.</span></span>
        </div>
        {children}
        <p className="privacy"><span aria-hidden="true">♧</span> Seus dados são tratados com cuidado e segurança.</p>
      </section>

    </>
  );
}


