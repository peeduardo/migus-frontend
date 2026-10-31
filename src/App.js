import React from "react";
import { AuthProvider } from "./context/auth";
import StackRoutes from "./routes/stack.routes";


const styles = String.raw`
.site-shell { width: min(1440px, 100%); min-height: 100vh; margin: auto; padding: 0 6.2%; display: flex; flex-direction: column; }
.auth-layout { flex: 1; display: grid; grid-template-columns: minmax(0, 1.07fr) minmax(390px, .93fr); align-items: center; gap: clamp(45px, 8vw, 120px); padding: clamp(42px, 6vw, 76px) 0 55px; }
@media (max-width: 1000px) {
  .site-shell { padding: 0 4%; }
  .auth-layout { gap: 5vw; grid-template-columns: minmax(0, 1fr) minmax(350px, .9fr); }
}
@media (max-width: 760px) {
  .site-shell { padding: 0 21px; }
  .auth-layout { display: block; padding: 32px 0; }
}
@media (max-width: 430px) {
  .site-shell { padding: 0 14px; }
  .auth-layout { padding-top: 21px; }
}

`;

export default function App() {
  return (
    <>
      <style>{styles}</style>

      <AuthProvider>
        <StackRoutes />
      </AuthProvider>

    </>
  );
}
