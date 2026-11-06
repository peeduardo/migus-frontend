import React from "react";


const styles = String.raw`
.welcome-panel { min-height: 550px; display: flex; flex-direction: column; justify-content: space-between; padding: 8px 0 0 3%; }
.eyebrow, .kicker { display: inline-flex; align-items: center; gap: 9px; color: #68827a; font-size: 10px; font-weight: 760; letter-spacing: 1.5px; }
.eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: var(--coral); box-shadow: 0 0 0 4px #f9e4dc; }
.welcome-panel h1 { max-width: 620px; margin: 22px 0 17px; font: 500 clamp(39px,4.4vw,60px)/1.12 Georgia,serif; letter-spacing: -2.3px; }
.welcome-panel h1 em { color: var(--teal); font-weight: 500; }
.welcome-panel > div:first-child > p { max-width: 390px; margin: 0; color: var(--soft); font-size: 14px; line-height: 1.75; }
.illustration { height: 255px; position: relative; overflow: hidden; width: min(100%,480px); margin: 24px auto 0; border-radius: 48% 52% 40% 60% / 53% 42% 58% 47%; background: #e7eee4; }
.sun { position: absolute; top: 21px; left: 38%; width: 135px; height: 135px; border-radius: 50%; background: #f1cd79; }
.figure { position: absolute; z-index: 1; bottom: -24px; width: 100px; height: 170px; }
.figure i { position: absolute; z-index: 2; top: 12px; left: 28px; width: 48px; height: 54px; border-radius: 48%; background: #76503f; }
.figure span { position: absolute; bottom: 0; width: 100px; height: 125px; border-radius: 48% 48% 0 0; background: #e87b5d; }
.figure-a { left: 22%; transform: rotate(-8deg); }
.figure-b { left: 42%; z-index: 2; transform: scale(1.08); }
.figure-b i { background: #bd7a58; }
.figure-b span { background: #f4c45e; }
.figure-c { left: 62%; transform: rotate(7deg); }
.figure-c i { background: #593c36; }
.figure-c span { background: #3f8076; }
.note { position: absolute; z-index: 3; padding: 9px 12px; border: 1px solid #e6e7de; border-radius: 12px; color: var(--ink); background: #fffdf5; box-shadow: 0 7px 25px #234b4014; font-size: 10px; line-height: 1.45; }
.note-a { top: 28px; left: 8%; transform: rotate(-5deg); }
.note-b { top: 80px; right: 5%; transform: rotate(5deg); }
.note b, .welcome-caption span { color: var(--coral); }
.spark { position: absolute; top: 35px; right: 18%; color: #d9a83b; font-size: 19px; }
.welcome-caption { display: flex; align-items: center; gap: 9px; padding-top: 18px; color: #788780; font-size: 11px; }
.welcome-caption span { font-size: 18px; }
@media (max-width: 1000px) {
  .welcome-panel { min-height: 510px; }
  .welcome-panel h1 { font-size: clamp(38px,5vw,52px); }
}
@media (max-width: 760px) { .welcome-panel { display: none; } }

`;

export default function WelcomePanel() {
  return (
      <>
        <style>{styles}</style>

    <section className="welcome-panel" aria-labelledby="welcome-title">
      <div>
        <span className="eyebrow"><i /> UMA REDE FEITA DE ENCONTROS</span>
        <h1 id="welcome-title">Conexões que acolhem.<br /><em>Caminhos que aproximam.</em></h1>
        <p>Um espaço para se aproximar, participar e fazer parte de uma comunidade mais inclusiva.</p>
      </div>
      <div className="illustration" role="img" aria-label="Ilustração de pessoas reunidas">
        <div className="sun" />
        <div className="note note-a">cada pessoa<br />faz diferença <b>✳</b></div>
        <div className="note note-b"><b>♥</b> juntos, mais perto</div>
        <div className="figure figure-a"><i /><span /></div>
        <div className="figure figure-b"><i /><span /></div>
        <div className="figure figure-c"><i /><span /></div>
        <span className="spark">✦</span>
      </div>
      <p className="welcome-caption"><span>✿</span> Presença, afeto e inclusão em cada encontro.</p>
    </section>

      </>
  );
}


