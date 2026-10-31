import React from "react";

const styles = String.raw`
.alert, .success { margin: 0 0 16px; padding: 10px 12px; border: 1px solid; border-radius: 8px; font-size: 12px; line-height: 1.5; }
.alert { border-color: #f3c4b8; color: #984936; background: #fff2ed; }
.success { margin-bottom: 15px; border-color: #c5dfcf; color: #286446; background: #eff8f0; }

`;

export default function FeedbackMessage({ type = "error", children }) {
  if (!children) return null;
  return (
    <>
      <style>{styles}</style>
      <div className={type === "success" ? "success" : "alert"} role={type === "success" ? "status" : "alert"}>{children}</div>
    </>
  );
}

