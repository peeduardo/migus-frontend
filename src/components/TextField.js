import React, { useId } from "react";

export const fieldStyles = String.raw`
.field { min-width: 0; display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; color: #2f4640; font-size: 13px; font-weight: 680; }
.field small { color: #4f6159; font-size: 12px; font-weight: 450; }
.field input { width: 100%; height: 47px; padding: 0 13px; border: 1px solid var(--border-ui); border-radius: 9px; color: var(--ink); background: white; font-size: 14px; font-weight: 450; }
.field input::placeholder { color: #4f6159; }
.field input:focus { border-color: var(--focus); box-shadow: 0 0 0 3px #1d5e5733; }
`;

/**
 * Campo de texto com rótulo associado (htmlFor), instrução opcional e mensagem de erro
 * ligada ao campo por aria-describedby.
 */
export default function TextField({ label, optional, help, error, required = true, ...inputProps }) {
  const id = useId();
  const helpId = `${id}-ajuda`;
  const errorId = `${id}-erro`;
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <style>{fieldStyles}</style>
      <label htmlFor={id}>
        {label}{optional && <> <small>(opcional)</small></>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {help && <small id={helpId}>{help}</small>}
      {error && <span id={errorId} className="field-error">{error}</span>}
    </div>
  );
}
