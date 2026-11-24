import React, { useId } from "react";
import { fieldStyles } from "./TextField";

const styles = String.raw`
.password-box { position: relative; display: block; }
.password-box input { padding-right: 84px; }
.password-box button { position: absolute; top: 50%; right: 8px; min-height: 32px; padding: 5px 8px; transform: translateY(-50%); border: 0; border-radius: 6px; color: #1d5e57; background: transparent; font-size: 12px; font-weight: 700; cursor: pointer; }
.password-box button:hover { background: #e4eee7; }
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
  error,
  required = true,
}) {
  const id = useId();
  const helpId = `${id}-ajuda`;
  const errorId = `${id}-erro`;
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <style>{fieldStyles}</style>
      <style>{styles}</style>
      <label htmlFor={id}>{label}</label>
      <span className="password-box">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
        />
        <button type="button" onClick={onToggle} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
      {help && <small id={helpId}>{help}</small>}
      {error && <span id={errorId} className="field-error">{error}</span>}
    </div>
  );
}
