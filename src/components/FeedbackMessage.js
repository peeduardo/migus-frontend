import React from "react";

const styles = String.raw`
.alert, .success { margin: 0 0 18px; padding: 12px 14px; border: 1px solid; border-radius: 10px; font-size: 13px; line-height: 1.5; display: flex; align-items: center; gap: 10px; }
.alert { border-color: #f3c4b8; color: #984936; background: #fff2ed; }
.success { border-color: #c5dfcf; color: #1e5e3a; background: #edf7ef; }
.feedback-icon { font-size: 15px; font-weight: 700; flex: 0 0 auto; display: grid; place-items: center; }
`;

export default function FeedbackMessage({ type = "error", children }) {
  if (!children) return null;
  const isSuccess = type === "success";
  return (
    <>
      <style>{styles}</style>
      <div className={isSuccess ? "success" : "alert"} role={isSuccess ? "status" : "alert"}>
        <span className="feedback-icon" aria-hidden="true">{isSuccess ? "✓" : "⚠"}</span>
        <span style={{ flex: 1 }}>{children}</span>
      </div>
    </>
  );
}
