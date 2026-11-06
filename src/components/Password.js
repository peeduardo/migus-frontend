import React from "react";


const styles = String.raw`
.field { min-width: 0; display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; color: #3d5953; font-size: 12px; font-weight: 680; }
.field small { color: #95a09a; font-size: 10px; font-weight: 450; }
.field input { width: 100%; height: 47px; padding: 0 13px; border: 1px solid #dfe5dd; border-radius: 9px; outline: none; color: var(--ink); background: white; font-size: 13px; font-weight: 450; }
.field input::placeholder { color: #a5ada8; }
.field input:focus { border-color: #5c9f91; box-shadow: 0 0 0 3px #408e7e1c; }
.password-box { position: relative; display: block; }
.password-box input { padding-right: 76px; }
.password-box button { position: absolute; top: 50%; right: 10px; padding: 5px; transform: translateY(-50%); border: 0; color: #66847c; background: transparent; font-size: 10px; font-weight: 700; cursor: pointer; }

`;

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
  visible,
  onToggle,
  minLength,
  maxLength,
  help,
  required = true,
}) {
  return (
      <>
        <style>{styles}</style>

    <label className="field">
      {label}
      <span className="password-box">
        <input
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
      {help && <small>{help}</small>}
    </label>

      </>
  );
}


